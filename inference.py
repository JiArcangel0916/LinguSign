import cv2
import mediapipe as mp
import numpy as np
import joblib
import time


print("--- [1/4] Loading ASL Model... ---") #nilagyan ko lang nito para makita yung progress (mabagal kasi mag-run hehe)
try:
    data = joblib.load('asl_model.pkl')
    model = data['classifier']
    encoder = data['label_encoder']
    print("✅ Model and Encoder loaded successfully.")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    exit()

print("--- [2/4] Initializing MediaPipe Hand Landmarker... ---")
BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path='hand_landmarker.task'),
    running_mode=VisionRunningMode.VIDEO, 
    num_hands=1)

try:
    detector = HandLandmarker.create_from_options(options)
    print("✅ MediaPipe initialized.")
except Exception as e:
    print(f"❌ Error initializing MediaPipe: {e}")
    print("Check if 'hand_landmarker.task' is in the same folder.")
    exit()

print("--- [3/4] Opening Webcam... ---")
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Error: Could not open webcam. Check if another app is using it.")
    exit()

cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
print("✅ Webcam is ready.")

print("--- [4/4] Starting Detection Loop (Press 'q' to exit) ---")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("❌ Failed to grab frame.")
        break
    
    frame = cv2.flip(frame, 1)
    h, w, _ = frame.shape
    
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
    
    timestamp = int(time.time() * 1000)
    
    try:
        result = detector.detect_for_video(mp_image, timestamp)

        if result.hand_landmarks:
            hand_lms = result.hand_landmarks[0]
            wrist = hand_lms[0]
            
            x_coords, y_coords, landmarks = [], [], []

            for lm in hand_lms:
                cx, cy = int(lm.x * w), int(lm.y * h)
                x_coords.append(cx)
                y_coords.append(cy)
                landmarks.extend([lm.x - wrist.x, lm.y - wrist.y, lm.z - wrist.z])
            
            x1, y1 = max(0, min(x_coords) - 20), max(0, min(y_coords) - 20)
            x2, y2 = min(w, max(x_coords) + 20), min(h, max(y_coords) + 20)

            if len(landmarks) == 63:
                pred_idx = model.predict([landmarks])[0]
                letter = encoder.inverse_transform([pred_idx])[0]
                
                try:
                    conf = np.max(model.predict_proba([landmarks]))
                except:
                    conf = 1.0 

                color = (180, 50, 180) 
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
                
                label_text = f"{letter.upper()} ({conf:.2f})"
                (t_w, t_h), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
                cv2.rectangle(frame, (x1, y1 - t_h - 10), (x1 + t_w, y1), color, -1)
                cv2.putText(frame, label_text, (x1, y1 - 5), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    except Exception as e:
        print(f"Loop Error: {e}")

    cv2.imshow('LinguSign', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Cleanup
print("Closing application...")
cap.release()
cv2.destroyAllWindows()