import cv2
import mediapipe as mp
import numpy as np
import argparse
import os
import glob
import kagglehub
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

OUTPUT_DIR = 'dataset'
CONNECTIONS = mp.tasks.vision.HandLandmarksConnections.HAND_CONNECTIONS

def get_landmarks_flat(hand_landmarks):
    wrist = hand_landmarks[0]
    landmarks_flat = []
    for lm in hand_landmarks:
        landmarks_flat.extend([lm.x - wrist.x, lm.y - wrist.y, lm.z - wrist.z])
    return landmarks_flat

def detect_landmarks(frame):
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
    result = detector.detect(mp_image)
    return result.hand_landmarks[0] if result.hand_landmarks else None

def draw_hand(frame, hand_landmarks, w, h):
    for lm in hand_landmarks:
        cv2.circle(frame, (int(lm.x * w), int(lm.y * h)), 5, (0, 0, 255), 3)
    for con in CONNECTIONS:
        p1, p2 = hand_landmarks[con.start], hand_landmarks[con.end]
        cv2.line(frame, (int(p1.x * w), int(p1.y * h)), (int(p2.x * w), int(p2.y * h)), (0, 255, 0), 2)

def next_index(label):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    all_files = glob.glob(os.path.join(OUTPUT_DIR, f"sign_{label}*.npy"))
    return len([f for f in all_files if '_images' not in f]) + 1

def save_npy(data, filename):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    path = os.path.join(OUTPUT_DIR, filename)
    np.save(path, data)
    print(f"Saved: {path}  shape: {data.shape}")


def collect_webcam(sequence_length=30, skip_frames=2):
    is_recording = False
    current_sequence = []
    cap = cv2.VideoCapture(0)
    frame_count = 0
    rec_key = ""
    char_count = {}

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break

        key = cv2.waitKey(1) & 0xFF
        if key >= ord('a') and key <= ord('z'):
            is_recording = True
            current_sequence = []
            frame_count = 0
            rec_key = chr(key)
            char_count[rec_key] = next_index(rec_key)
            print(f"Recording '{rec_key}' started...")
        if key == ord('.'): break

        frame = cv2.flip(frame, 1)
        h, w, _ = frame.shape
        hand_landmarks = detect_landmarks(frame)

        if hand_landmarks:
            draw_hand(frame, hand_landmarks, w, h)
            if is_recording:
                frame_count += 1
                cv2.putText(frame, f'REC {rec_key}: {len(current_sequence)}/{sequence_length}', (50, 100), cv2.FONT_HERSHEY_COMPLEX_SMALL, 1, (255, 255, 255), 2)
                if frame_count % skip_frames == 0:
                    if len(current_sequence) < sequence_length:
                        current_sequence.append(get_landmarks_flat(hand_landmarks))
                    else:
                        save_npy(np.array(current_sequence), f"sign_{rec_key}{char_count[rec_key]}.npy")
                        current_sequence = []
                        is_recording = False
        elif is_recording:
            cv2.putText(frame, "No hand detected!", (50, 140), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

        cv2.putText(frame, "Press . to exit", (20, 450), cv2.FONT_HERSHEY_SIMPLEX, .75, (0, 255, 0), 2)
        cv2.putText(frame, "Press any letter to record", (20, 25), cv2.FONT_HERSHEY_SIMPLEX, .5, (255, 255, 255), 2)
        cv2.imshow('ASL Data Collection', frame)

    cap.release()
    cv2.destroyAllWindows()


def collect_video(video_path, label, sequence_length=30, skip_frames=2, overlap=0.5):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"[ERROR] Cannot open: {video_path}"); return

    step = max(1, int(sequence_length * (1 - overlap)))
    file_idx = next_index(label)
    current_sequence = []
    frame_count = 0
    saved = 0

    print(f"Processing '{video_path}'  label='{label}'")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break

        frame_count += 1
        if frame_count % skip_frames != 0: continue

        hand_landmarks = detect_landmarks(cv2.flip(frame, 1))
        if hand_landmarks:
            current_sequence.append(get_landmarks_flat(hand_landmarks))

        if len(current_sequence) >= sequence_length:
            save_npy(np.array(current_sequence[:sequence_length]), f"sign_{label}{file_idx}.npy")
            file_idx += 1
            saved += 1
            current_sequence = current_sequence[step:]

    cap.release()
    print(f"Done. {saved} sequence(s) saved.")


def collect_images(image_folder, label):
    paths = sorted(
        glob.glob(os.path.join(image_folder, '*.jpg')) +
        glob.glob(os.path.join(image_folder, '*.jpeg')) +
        glob.glob(os.path.join(image_folder, '*.png'))
    )
    if not paths:
        print(f"[ERROR] No images found in: {image_folder}"); return

    print(f"Processing {len(paths)} image(s) for label '{label}'...")
    all_landmarks = []
    skipped = 0

    for i, p in enumerate(paths):
        frame = cv2.imread(p)
        hand_landmarks = detect_landmarks(frame) if frame is not None else None
        if hand_landmarks:
            all_landmarks.append(get_landmarks_flat(hand_landmarks))
        else:
            print(f"  [skip] {os.path.basename(p)}")
            skipped += 1

        if (i + 1) % 100 == 0:
            print(f"  Progress: {i + 1}/{len(paths)}")

    if not all_landmarks:
        print("[ERROR] No valid landmarks extracted."); return

    save_npy(np.array(all_landmarks), f"sign_{label}_images.npy")
    print(f"{len(all_landmarks)} ok  /  {skipped} skipped")


def collect_kaggle(sequence_length=30, skip_frames=2):
    print("Downloading ASL Alphabet dataset from Kaggle...")
    path = kagglehub.dataset_download("grassknoted/asl-alphabet")
    print(f"Dataset path: {path}")

    # find the folder that contains A-Z subfolders
    train_dir = None
    for root, dirs, _ in os.walk(path):
        if any(d.upper() in list('ABCDEFGHIJKLMNOPQRSTUVWXYZ') for d in dirs):
            train_dir = root
            break

    if not train_dir:
        print("[ERROR] Could not find letter folders in dataset."); return

    print(f"Found training folder: {train_dir}\n")

    for letter in 'abcdefghijklmnopqrstuvwxyz':
        folder = os.path.join(train_dir, letter.upper())
        if os.path.isdir(folder):
            collect_images(folder, letter)
        else:
            print(f"  [skip] folder not found: {folder}")


def main():
    parser = argparse.ArgumentParser(
        description='LinguSign — ASL data collection',
        formatter_class=argparse.RawTextHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python data_collection.py --mode webcam\n"
            "  python data_collection.py --mode video  --input videos/sign_a.mp4 --label a\n"
            "  python data_collection.py --mode image  --input images/a/ --label a\n"
            "  python data_collection.py --mode kaggle"
        ))
    parser.add_argument('--mode', choices=['webcam', 'video', 'image', 'kaggle'], default='webcam')
    parser.add_argument('--input', '-i', default=None)
    parser.add_argument('--label', '-l', default=None)
    parser.add_argument('--seq', type=int, default=30)
    parser.add_argument('--skip', type=int, default=2)
    parser.add_argument('--overlap', type=float, default=0.5)
    args = parser.parse_args()

    if args.mode in ('video', 'image') and not (args.input and args.label):
        print(f"[ERROR] --mode {args.mode} requires --input and --label"); return

    if args.mode == 'webcam':
        collect_webcam(sequence_length=args.seq, skip_frames=args.skip)
    elif args.mode == 'video':
        collect_video(args.input, args.label, sequence_length=args.seq, skip_frames=args.skip, overlap=args.overlap)
    elif args.mode == 'image':
        collect_images(args.input, args.label)
    elif args.mode == 'kaggle':
        collect_kaggle(sequence_length=args.seq, skip_frames=args.skip)


if __name__ == '__main__':
    main()