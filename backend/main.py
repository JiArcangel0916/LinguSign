from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import numpy as np
import joblib
import tempfile
import os
from collections import deque

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_data = joblib.load('asl_model_v3.pkl')
model = model_data['classifier']
encoder = model_data['label_encoder']

# Check if SVM was trained with probability=True
HAS_PROBA = hasattr(model, "predict_proba")

base_options = python.BaseOptions(model_asset_path='hand_landmarker.task')
options = vision.HandLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.IMAGE,
    num_hands=1
)
detector = vision.HandLandmarker.create_from_options(options)

WINDOW_SIZE = 30
CONFIDENCE_THRESHOLD = 0.6  # only used if probability=True


def get_landmarks(frame):
    if frame is None or frame.size == 0:
        return None

    h, w = frame.shape[:2]
    if w > 1280:
        scale = 1280 / w
        frame = cv2.resize(frame, (int(w * scale), int(h * scale)))

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    rgb_frame = np.ascontiguousarray(rgb_frame)

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
    result = detector.detect(mp_image)

    if result.hand_landmarks and len(result.hand_landmarks) > 0:
        hand_landmarks = result.hand_landmarks[0]
        wrist = hand_landmarks[0]
        landmarks = [
            coord
            for lm in hand_landmarks
            for coord in (lm.x - wrist.x, lm.y - wrist.y, lm.z - wrist.z)
        ]
        # 21 landmarks × 3 coords = 63 values
        if len(landmarks) == 63:
            return landmarks

    return None


@app.post("/translate-video")
async def translate_video(file: UploadFile = File(...)):
    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".webm")
    errors = []
    raw_predictions = []

    try:
        content = await file.read()
        temp.write(content)
        temp.close()

        cap = cv2.VideoCapture(temp.name)

        if not cap.isOpened():
            return {"text": "Error: Video file could not be opened", "debug": {}}

        sequence_buffer = deque(maxlen=WINDOW_SIZE)
        frame_count = 0
        detected_count = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            lm = get_landmarks(frame)

            if lm:
                detected_count += 1
                sequence_buffer.append(lm)

                if len(sequence_buffer) == WINDOW_SIZE:
                    try:
                        # SVM expects 2D input: (n_samples, n_features)
                        window_array = np.array(sequence_buffer, dtype=np.float32)  # (30, 63)
                        input_flat = window_array.flatten().reshape(1, -1)           # (1, 1890)

                        if HAS_PROBA:
                            # SVM trained with probability=True
                            proba = model.predict_proba(input_flat)[0]  # (num_classes,)
                            max_prob = float(np.max(proba))
                            pred_idx = int(np.argmax(proba))

                            if max_prob > CONFIDENCE_THRESHOLD:
                                label = encoder.inverse_transform([pred_idx])[0]
                                raw_predictions.append(label)
                        else:
                            # SVM trained without probability — direct class prediction
                            pred = model.predict(input_flat)[0]  # returns encoded int or label
                            label = encoder.inverse_transform([pred])[0]
                            raw_predictions.append(label)

                    except Exception as e:
                        errors.append(f"Frame {frame_count}: {str(e)}")

        cap.release()

        debug_info = {
            "total_frames": frame_count,
            "frames_with_hand": detected_count,
            "has_proba": HAS_PROBA,
            "expected_features": WINDOW_SIZE * 63,  # should match training
            "raw_predictions": raw_predictions,
            "errors": errors[:5]
        }

    except Exception as e:
        return {"text": f"Server error: {str(e)}", "debug": {"errors": [str(e)]}}

    finally:
        if os.path.exists(temp.name):
            os.unlink(temp.name)

    if not raw_predictions:
        return {"text": "No sign detected", "debug": debug_info}

    # Deduplicate consecutive same predictions
    detected_sequence = []
    for i, pred in enumerate(raw_predictions):
        if i == 0 or pred != raw_predictions[i - 1]:
            detected_sequence.append(pred)

    return {
        "text": " ".join(detected_sequence),
        "debug": debug_info
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)