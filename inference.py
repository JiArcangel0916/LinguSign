# this is the main file that runs the webcam and does the inference using the trained model. 
# it uses mediapipe to detect the hand landmarks and then uses the trained model to predict the letter being signed.
# press L to switch to letters mode, press N to switch to numbers mode, press Q to exit.
import cv2
import mediapipe as mp
import numpy as np
import joblib
import time

print("--- Loading ASL Models... ---") #nilagyan ko lang nito para makita yung progress (mabagal kasi mag-run hehe)
try:
    letters_data  = joblib.load('asl_model_v2.pkl')
    letters_model = letters_data['classifier']
    letters_enc   = letters_data['label_encoder']
    print("Letters model loaded successfully.")
except Exception as e:
    print(f"Error loading letters model: {e}")
    exit()

try:
    digits_data  = joblib.load('asl_model_digits.pkl')
    digits_model = digits_data['classifier']
    digits_enc   = digits_data['label_encoder']
    print("Digits model loaded successfully.")
except Exception as e:
    print(f"Warning: Digits model not found ({e}). Running letters only.")
    digits_model = None
    digits_enc   = None

print("--- Initializing MediaPipe Hand Landmarker... ---")
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
    print("MediaPipe initialized.")
except Exception as e:
    print(f"Error initializing MediaPipe: {e}")
    print("Check if 'hand_landmarker.task' is in the same folder.")
    exit()

print("--- Opening Webcam... ---")
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Error: Could not open webcam. Check if another app is using it.")
    exit()

cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
print("Webcam is ready.")

print("--- Starting Detection Loop (L = Letters | N = Numbers | Q = Exit) ---")

frame_timestamp_ms = 0

mode = 'letters'

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("Error: Failed to grab frame.")
        break

    frame = cv2.flip(frame, 1)
    h, w, _ = frame.shape

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image  = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

    frame_timestamp_ms += 1

    bar_color   = (180, 50, 180) if mode == 'letters' else (50, 150, 255)
    mode_label  = 'LETTERS MODE  (press N for numbers)' if mode == 'letters' else 'NUMBERS MODE  (press L for letters)'
    cv2.rectangle(frame, (0, 0), (w, 36), bar_color, -1)
    cv2.putText(frame, mode_label, (10, 24),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    try:
        result = detector.detect_for_video(mp_image, frame_timestamp_ms)

        if result.hand_landmarks:
            hand_lms = result.hand_landmarks[0]
            wrist    = hand_lms[0]

            x_coords, y_coords, landmarks = [], [], []

            for lm in hand_lms:
                cx, cy = int(lm.x * w), int(lm.y * h)
                x_coords.append(cx)
                y_coords.append(cy)
                landmarks.extend([lm.x - wrist.x, lm.y - wrist.y, lm.z - wrist.z])

            x1, y1 = max(0, min(x_coords) - 20), max(0, min(y_coords) - 20)
            x2, y2 = min(w, max(x_coords) + 20), min(h, max(y_coords) + 20)

            if len(landmarks) == 63:

                if mode == 'letters':
                    pred_idx = letters_model.predict([landmarks])[0]
                    display  = letters_enc.inverse_transform([pred_idx])[0].upper()
                    try:
                        conf = np.max(letters_model.predict_proba([landmarks]))
                    except:
                        conf = 1.0
                    color = (180, 50, 180)

                else:
                    if digits_model is not None:
                        pred_idx = digits_model.predict([landmarks])[0]
                        raw      = digits_enc.inverse_transform([pred_idx])[0]
                        display  = raw.replace('digit_', '')
                        try:
                            conf = np.max(digits_model.predict_proba([landmarks]))
                        except:
                            conf = 1.0
                    else:
                        display = '?'
                        conf    = 0.0
                    color = (50, 150, 255)

                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)

                label_text = f"{display} ({conf:.2f})"
                (t_w, t_h), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
                cv2.rectangle(frame, (x1, y1 - t_h - 10), (x1 + t_w, y1), color, -1)
                cv2.putText(frame, label_text, (x1, y1 - 5),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    except Exception as e:
        print(f"Loop Error: {e}")

    cv2.imshow('LinguSign', frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('l'):
        mode = 'letters'
        print("Switched to LETTERS mode")
    elif key == ord('n'):
        if digits_model is not None:
            mode = 'digits'
            print("Switched to NUMBERS mode")
        else:
            print("Digits model not loaded. Train asl_model_digits.pkl first.")

print("Closing application...")
cap.release()
cv2.destroyAllWindows()