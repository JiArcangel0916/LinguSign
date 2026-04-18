import cv2
import mediapipe as mp
import numpy as np
import joblib
from collections import deque

print("--- Loading ASL Word Model... ---")
try:
    # Gagamitin natin ang v3 model mo na may words
    model_data = joblib.load('asl_model_v3.pkl')
    model = model_data['classifier']
    label_enc = model_data['label_encoder']
    print("ASL Word model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    exit()

BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path='hand_landmarker.task'),
    running_mode=VisionRunningMode.VIDEO,
    num_hands=1)

detector = HandLandmarker.create_from_options(options)

cap = cv2.VideoCapture(0)
frame_timestamp_ms = 0

# Buffer para sa smoothing (para hindi "flickering" ang text)
prediction_history = deque(maxlen=15) 

print("--- Starting Word Detection (Press Q to Exit) ---")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret: break

    frame = cv2.flip(frame, 1)
    h, w, _ = frame.shape
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
    frame_timestamp_ms += 1

    # Header Bar
    cv2.rectangle(frame, (0, 0), (w, 40), (249, 115, 22), -1)
    cv2.putText(frame, "PALMINGO LIVE: WORD MODE", (10, 28),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    try:
        result = detector.detect_for_video(mp_image, frame_timestamp_ms)

        if result.hand_landmarks:
            hand_lms = result.hand_landmarks[0]
            wrist = hand_lms[0]
            
            landmarks = []
            for lm in hand_lms:
                # Normalization: relative to wrist (ito yung ginamit mo sa training)
                landmarks.extend([lm.x - wrist.x, lm.y - wrist.y, lm.z - wrist.z])

            if len(landmarks) == 63:
                # 1. Prediction
                pred_idx = model.predict([landmarks])[0]
                label = label_enc.inverse_transform([pred_idx])[0]
                
                # 2. Confidence Score
                try:
                    conf = np.max(model.predict_proba([landmarks]))
                except:
                    conf = 1.0

                # 3. Temporal Smoothing (Dito magiging "Word" ready ang system mo)
                # Imbes na i-display agad, hihintayin nating mag-agree ang AI sa huling 15 frames
                prediction_history.append(label)
                most_common_label = max(set(prediction_history), key=prediction_history.count)
                
                # UI feedback
                color = (249, 115, 22) # Palmingo Orange
                label_display = f"{most_common_label.upper()} ({conf:.2f})"
                
                # Draw bounding box (optional but helpful for defense)
                x_min = int(min([lm.x for lm in hand_lms]) * w) - 20
                y_min = int(min([lm.y for lm in hand_lms]) * h) - 20
                cv2.putText(frame, label_display, (x_min, y_min - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)

    except Exception as e:
        print(f"Error: {e}")

    cv2.imshow('Palmingo Inference', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'): break

cap.release()
cv2.destroyAllWindows()