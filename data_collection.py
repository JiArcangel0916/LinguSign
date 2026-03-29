import cv2
import mediapipe as mp
import numpy as np
from mediapipe.tasks.python.vision import HandLandmarksConnections

model_path = 'hand_landmarker.task' 

BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode
options = HandLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=model_path),
    running_mode=VisionRunningMode.IMAGE,
    num_hands=1)
detector = HandLandmarker.create_from_options(options)

def main():
    is_recording = False
    current_sequence = []
    sequence_length = 15
    cap = cv2.VideoCapture(0)
    frame_count = 0
    skip_frames = 2
    rec_key = ""
    char_count = {}
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break

        key = cv2.waitKey(1) & 0xFF
        if key != 255:
            print(chr(key))
        if key >= ord('a') and key <= ord('z'):
            is_recording = True
            current_sequence = []
            rec_key = chr(key)
            char_count[rec_key] = char_count.get(rec_key, 0) + 1
            print("Recording started...")
        if key == ord('.'):
            break

        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        detection_result = detector.detect(mp_image)
        connections_list = mp.tasks.vision.HandLandmarksConnections.HAND_CONNECTIONS

        if detection_result.hand_landmarks:
            for hand_landmarks in detection_result.hand_landmarks:
                for lm in hand_landmarks:
                    cx, cy = int(lm.x * w), int(lm.y * h)
                    cv2.circle(frame, (cx, cy), 5, (0, 0, 255), 3)

                if is_recording:
                    frame_count += 1
                    cv2.putText(frame, f'REC: {len(current_sequence)}/{sequence_length}', (50, 100), cv2.FONT_HERSHEY_COMPLEX_SMALL, 1, (255, 255, 255), 2)
                    if frame_count % skip_frames == 0:
                        if len(current_sequence) < sequence_length:
                            wrist = hand_landmarks[0]
                            landmarks_flat = []
                            for lm in hand_landmarks:
                                landmarks_flat.extend([lm.x - wrist.x, lm.y - wrist.y, lm.z - wrist.z])
                            current_sequence.append(landmarks_flat)
                        else:
                            all_data = np.array(current_sequence)
                            file_name = f"sign_{rec_key}{char_count[rec_key]}.npy"
                            np.save(file_name, all_data)
                            current_sequence = []
                            is_recording = False
                            print(f"Sequence Saved: {file_name}")

                for con in connections_list:
                    p1 = hand_landmarks[con.start]
                    p2 = hand_landmarks[con.end]
                    v1 = (int(p1.x * w), (int(p1.y * h)))
                    v2 = (int(p2.x * w), (int(p2.y * h)))
                    cv2.line(frame, v1, v2, (0, 255, 0), 2)
  
        cv2.putText(frame, "Press . to exit", (20, 450), cv2.FONT_HERSHEY_SIMPLEX, .75, (0, 255, 0), 2)
        cv2.putText(frame, "Press any letter to record", (20, 25), cv2.FONT_HERSHEY_SIMPLEX, .5, (255, 255, 255), 2)
        cv2.imshow('ASL Data Collection', frame)

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    main()