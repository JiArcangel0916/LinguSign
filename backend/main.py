import os
import tempfile
from collections import deque
from contextlib import asynccontextmanager

import cv2
import joblib
import mediapipe as mp
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

WINDOW_SIZE = 30
CONFIDENCE_THRESHOLD = 0.6
MAX_FRAME_WIDTH = 1280

model_cache: dict = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio
    loop = asyncio.get_event_loop()

    def _load_resources():
        data = joblib.load("asl_model_v3.pkl")
        clf = data["classifier"]
        enc = data["label_encoder"]
        sep_scaler = data.get("scaler", None)

        is_pipeline = hasattr(clf, "named_steps")

        if is_pipeline:
            step_names = list(clf.named_steps.keys())
            scaler_step = clf.named_steps[step_names[0]]
            final_step = clf.named_steps[step_names[-1]]
        else:
            scaler_step = sep_scaler
            final_step = clf

        has_proba = hasattr(final_step, "predict_proba")

        model_cache["classifier"] = clf
        model_cache["encoder"] = enc
        model_cache["scaler_step"] = scaler_step
        model_cache["final_step"] = final_step
        model_cache["is_pipeline"] = is_pipeline
        model_cache["has_proba"] = has_proba

        base_options = python.BaseOptions(model_asset_path="hand_landmarker.task")
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_hands=1,
        )
        model_cache["detector"] = vision.HandLandmarker.create_from_options(options)

    await loop.run_in_executor(None, _load_resources)
    yield
    model_cache.clear()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_landmarks(frame: np.ndarray):
    if frame is None or frame.size == 0:
        return None

    height, width = frame.shape[:2]
    if width > MAX_FRAME_WIDTH:
        scale = MAX_FRAME_WIDTH / width
        frame = cv2.resize(frame, (int(width * scale), int(height * scale)))

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    rgb_frame = np.ascontiguousarray(rgb_frame, dtype=np.uint8)

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
    detection_result = model_cache["detector"].detect(mp_image)

    if not detection_result.hand_landmarks:
        return None

    hand_landmarks = detection_result.hand_landmarks[0]
    wrist = hand_landmarks[0]

    landmarks = [
        coord
        for lm in hand_landmarks
        for coord in (
            lm.x - wrist.x,
            lm.y - wrist.y,
            lm.z - wrist.z,
        )
    ]

    return landmarks if len(landmarks) == 63 else None

def predict_window(window: np.ndarray):
    scaler_step = model_cache["scaler_step"]
    final_step = model_cache["final_step"]
    has_proba = model_cache["has_proba"]
    encoder = model_cache["encoder"]

    frame_predictions = []

    for frame in window:
        frame_input = frame.reshape(1, -1)
        
        if scaler_step is not None:
            frame_input = scaler_step.transform(frame_input)

        if has_proba:
            probs = final_step.predict_proba(frame_input)[0]
            max_p = np.max(probs)
            if max_p > CONFIDENCE_THRESHOLD:
                frame_predictions.append(int(np.argmax(probs)))
        else:
            pred = final_step.predict(frame_input)[0]
            frame_predictions.append(int(pred))

    if not frame_predictions:
        return None

    most_frequent_idx = max(set(frame_predictions), key=frame_predictions.count)
    occurrence = frame_predictions.count(most_frequent_idx)

    if occurrence < 10:
        return None

    label = encoder.inverse_transform([most_frequent_idx])[0]
    return label, (occurrence / WINDOW_SIZE)

@app.post("/translate-video")
async def translate_video(file: UploadFile = File(...)):
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".webm")
    prediction_errors = []
    raw_predictions = []
    total_frames = 0
    frames_with_hand = 0

    try:
        video_bytes = await file.read()
        temp_file.write(video_bytes)
        temp_file.close()

        cap = cv2.VideoCapture(temp_file.name)
        if not cap.isOpened():
            return {"text": "Error: Could not open video.", "debug": {"error": "OpenCV fail"}}

        landmark_buffer = deque(maxlen=WINDOW_SIZE)

        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break

            total_frames += 1
            landmarks = extract_landmarks(frame)
            if landmarks is None:
                continue

            frames_with_hand += 1
            landmark_buffer.append(landmarks)

            if len(landmark_buffer) < WINDOW_SIZE:
                continue

            try:
                window_array = np.array(landmark_buffer, dtype=np.float32)
                result = predict_window(window_array)
                if result is not None:
                    label, confidence = result
                    raw_predictions.append(label)
            except Exception as e:
                prediction_errors.append(f"F{total_frames}: {str(e)}")

        cap.release()

    except Exception as e:
        return {"text": f"Error: {str(e)}", "debug": {"errors": [str(e)]}}
    finally:
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)

    debug_info = {
        "total_frames": total_frames,
        "frames_with_hand": frames_with_hand,
        "estimator": type(model_cache.get("final_step")).__name__,
        "raw": raw_predictions,
        "errors": prediction_errors[:5],
    }

    if not raw_predictions:
        return {"text": "No sign detected", "debug": debug_info}

    detected_sequence = []
    for i, pred in enumerate(raw_predictions):
        if i == 0 or pred != raw_predictions[i - 1]:
            detected_sequence.append(pred)

    return {"text": " ".join(detected_sequence), "debug": debug_info}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)