import cv2
import mediapipe as mp
import numpy as np
import argparse
import os
import glob
import kagglehub
import time

MODEL_PATH = 'hand_landmarker.task'
OUTPUT_DIR = 'dataset'

BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

def create_detector():
    options = HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=MODEL_PATH),
        running_mode=VisionRunningMode.IMAGE,
        num_hands=1
    )
    return HandLandmarker.create_from_options(options)

detector = create_detector()

def get_landmarks_flat(hand_landmarks):
    """Normalizes landmarks relative to the wrist (landmark 0)."""
    wrist = hand_landmarks[0]
    return [coord for lm in hand_landmarks for coord in (lm.x - wrist.x, lm.y - wrist.y, lm.z - wrist.z)]

def detect_landmarks(frame):
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
    result = detector.detect(mp_image)
    return result.hand_landmarks[0] if result.hand_landmarks else None

def save_npy(data, filename):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, filename)
    np.save(path, np.array(data))
    print(f"Saved: {path} | Shape: {np.array(data).shape}")

def get_next_index(label):
    files = glob.glob(os.path.join(OUTPUT_DIR, f"sign_{label}*.npy"))
    return len([f for f in files if '_images' not in f]) + 1


def collect_webcam(seq_len=30, skip_frames=2):
    cap = cv2.VideoCapture(0)
    recording, current_seq, rec_key = False, [], ""
    frame_count = 0

    print("Webcam Started. Press A-Z to record, '.' to exit.")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break

        frame = cv2.flip(frame, 1)
        display_frame = frame.copy()
        h, w, _ = frame.shape

        key = cv2.waitKey(1) & 0xFF
        if ord('a') <= key <= ord('z'):
            recording, rec_key, current_seq, frame_count = True, chr(key), [], 0
            print(f"Recording '{rec_key.upper()}'...")
        elif key == ord('.'): break

        landmarks = detect_landmarks(frame)
        if landmarks:
            for lm in landmarks:
                cv2.circle(display_frame, (int(lm.x * w), int(lm.y * h)), 3, (0, 255, 0), -1)
            
            if recording:
                frame_count += 1
                if frame_count % skip_frames == 0:
                    current_seq.append(get_landmarks_flat(landmarks))
                    if len(current_seq) >= seq_len:
                        save_npy(current_seq, f"sign_{rec_key}{get_next_index(rec_key)}.npy")
                        recording = False

        status = f"REC {rec_key.upper()}: {len(current_seq)}/{seq_len}" if recording else "READY"
        cv2.putText(display_frame, status, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255) if recording else (0, 255, 0), 2)
        cv2.imshow('LinguSign Data Collection', display_frame)

    cap.release()
    cv2.destroyAllWindows()

def collect_video(path, label, seq_len=30, skip_frames=2, overlap=0.5):
    cap = cv2.VideoCapture(path)
    if not cap.isOpened(): return print(f"Error: Cannot open {path}")

    step = max(1, int(seq_len * (1 - overlap)))
    current_seq, saved_count, frame_idx = [], 0, 0
    idx = get_next_index(label)

    print(f"Processing Video: {path}")
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break

        frame_idx += 1
        if frame_idx % skip_frames != 0: continue

        landmarks = detect_landmarks(cv2.flip(frame, 1))
        if landmarks:
            current_seq.append(get_landmarks_flat(landmarks))

        if len(current_seq) >= seq_len:
            save_npy(current_seq[:seq_len], f"sign_{label}{idx}.npy")
            current_seq = current_seq[step:]
            idx += 1
            saved_count += 1

    cap.release()
    print(f"Finished. Sequences saved: {saved_count}")

def collect_images(folder, label):
    extensions = ['*.jpg', '*.jpeg', '*.png']
    paths = []
    for ext in extensions:
        paths.extend(glob.glob(os.path.join(folder, ext)))
    paths = sorted(paths)

    if not paths: return print(f"No images in {folder}")

    print(f"Processing {len(paths)} images for '{label}'...")
    data = [get_landmarks_flat(lms) for p in paths if (frame := cv2.imread(p)) is not None and (lms := detect_landmarks(frame))]
    
    if data:
        save_npy(data, f"sign_{label}_images.npy")
    else:
        print("No landmarks found in folder.")

def collect_kaggle():
    print("Downloading ASL Dataset...")
    path = kagglehub.dataset_download("grassknoted/asl-alphabet")
    
    train_dir = next((root for root, dirs, _ in os.walk(path) if any(d.upper() in 'ABC' for d in dirs)), None)
    
    if not train_dir: return print("Dataset structure unknown.")

    for letter in 'abcdefghijklmnopqrstuvwxyz':
        folder = os.path.join(train_dir, letter.upper())
        if os.path.isdir(folder):
            collect_images(folder, letter)

def main():
    parser = argparse.ArgumentParser(description='LinguSign Optimizer')
    parser.add_argument('--mode', choices=['webcam', 'video', 'image', 'kaggle'], default='webcam')
    parser.add_argument('--input', '-i')
    parser.add_argument('--label', '-l')
    parser.add_argument('--seq', type=int, default=30)
    parser.add_argument('--skip', type=int, default=2)
    parser.add_argument('--overlap', type=float, default=0.5)
    args = parser.parse_args()

    if args.mode in ('video', 'image') and not (args.input and args.label):
        return print("Error: --input and --label are required for this mode.")

    modes = {
        'webcam': lambda: collect_webcam(args.seq, args.skip),
        'video':  lambda: collect_video(args.input, args.label, args.seq, args.skip, args.overlap),
        'image':  lambda: collect_images(args.input, args.label),
        'kaggle': collect_kaggle
    }
    modes[args.mode]()

if __name__ == '__main__':
    main()