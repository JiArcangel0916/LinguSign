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

base_options = python.BaseOptions(model_asset_path='hand_landmarker.task')
options = vision.HandLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.IMAGE,
    num_hands=1
)
detector = vision.HandLandmarker.create_from_options(options)

def get_landmarks(frame):
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
    result = detector.detect(mp_image)
    
    if result.hand_landmarks:
        hand_landmarks = result.hand_landmarks[0]
        wrist = hand_landmarks[0]
        return [
            coord 
            for lm in hand_landmarks 
            for coord in (lm.x - wrist.x, lm.y - wrist.y, lm.z - wrist.z)
        ]
    return None

@app.post("/translate-video")
async def translate_video(file: UploadFile = File(...)):
    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".webm")
    try:
        content = await file.read()
        temp.write(content)
        temp.close()

        cap = cv2.VideoCapture(temp.name)
        sequence_buffer = []
        window_size = 30 
        raw_predictions = []

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret: break
            
            lm = get_landmarks(frame)
            if lm:
                sequence_buffer.append(lm)
                
                if len(sequence_buffer) == window_size:
                    input_data = np.expand_dims(sequence_buffer, axis=0)
                    
                    try:
                        res = model.predict(input_data)[0]
                        if np.max(res) > 0.8:
                            pred_idx = np.argmax(res)
                            label = encoder.inverse_transform([pred_idx])[0]
                            raw_predictions.append(label)
                    except:
                        pass
                    
                    sequence_buffer.pop(0)
        cap.release()
    finally:
        if os.path.exists(temp.name):
            os.unlink(temp.name)

    if not raw_predictions:
        return {"text": "No sign detected"}

    detected_sequence = []
    for i in range(len(raw_predictions)):
        if i == 0 or raw_predictions[i] != raw_predictions[i-1]:
            detected_sequence.append(raw_predictions[i])

    return {"text": " ".join(detected_sequence)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)