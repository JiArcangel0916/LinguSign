import cv2
import mediapipe as mp
import numpy as np
import argparse
import os
import glob

# ── MediaPipe setup ──────────────────────────────────────────────────────────
options = mp.tasks.vision.HandLandmarkerOptions(
    base_options=mp.tasks.BaseOptions(model_asset_path='hand_landmarker.task'),
    running_mode=mp.tasks.vision.RunningMode.IMAGE,
    num_hands=1)
detector  = mp.tasks.vision.HandLandmarker.create_from_options(options)
CONNECTIONS = mp.tasks.vision.HandLandmarksConnections.HAND_CONNECTIONS

# ── Helpers ──────────────────────────────────────────────────────────────────
def process_frame(frame):
    """
    Detect hand on a BGR frame.
    Returns (landmarks, flat_63) or (None, None) if no hand found.
    """
    rgb    = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb))
    if not result.hand_landmarks:
        return None, None
    lms   = result.hand_landmarks[0]
    wrist = lms[0]
    flat  = [v for lm in lms for v in (lm.x - wrist.x, lm.y - wrist.y, lm.z - wrist.z)]
    return lms, flat


def draw_hand(frame, landmarks):
    h, w = frame.shape[:2]
    for c in CONNECTIONS:
        p1, p2 = landmarks[c.start], landmarks[c.end]
        cv2.line(frame, (int(p1.x*w), int(p1.y*h)), (int(p2.x*w), int(p2.y*h)), (0,255,0), 2)
    for lm in landmarks:
        cv2.circle(frame, (int(lm.x*w), int(lm.y*h)), 5, (0,0,255), 3)


def save_sequence(seq, label, idx, output_dir):
    """Save a (N, 63) sequence and print confirmation."""
    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, f"sign_{label}{idx}.npy")
    data = np.array(seq)
    np.save(path, data)
    print(f"  Saved: {path}  shape: {data.shape}")


def next_index(label, output_dir):
    """Return next safe file index to avoid overwriting existing .npy files."""
    return len(glob.glob(os.path.join(output_dir, f"sign_{label}*.npy"))) + 1


# ── Modes ────────────────────────────────────────────────────────────────────
def run_webcam(seq_len, skip, output_dir):
    print("\n[WEBCAM]  Press a letter to record · Press '.' to quit\n")
    cap       = cv2.VideoCapture(0)
    seq       = []
    frame_n   = 0
    rec_key   = ''
    recording = False
    char_idx  = {}

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        key = cv2.waitKey(1) & 0xFF
        if key == ord('.'):
            break
        if ord('a') <= key <= ord('z'):
            rec_key   = chr(key)
            recording = True
            seq       = []
            frame_n   = 0
            char_idx.setdefault(rec_key, next_index(rec_key, output_dir))
            print(f"  Recording '{rec_key}' ...")

        frame     = cv2.flip(frame, 1)
        lms, flat = process_frame(frame)

        if lms:
            draw_hand(frame, lms)
            if recording:
                frame_n += 1
                cv2.putText(frame, f"REC {rec_key}: {len(seq)}/{seq_len}",
                            (50, 100), cv2.FONT_HERSHEY_COMPLEX_SMALL, 1, (255,255,255), 2)
                if frame_n % skip == 0:
                    seq.append(flat)
                if len(seq) >= seq_len:
                    save_sequence(seq, rec_key, char_idx[rec_key], output_dir)
                    char_idx[rec_key] += 1
                    seq, recording = [], False
        elif recording:
            cv2.putText(frame, "No hand detected!", (50, 140),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,255), 2)

        cv2.putText(frame, "Press . to exit",            (20, 450), cv2.FONT_HERSHEY_SIMPLEX, .75, (0,255,0), 2)
        cv2.putText(frame, "Press any letter to record", (20,  25), cv2.FONT_HERSHEY_SIMPLEX, .5,  (255,255,255), 2)
        cv2.imshow('ASL Data Collection', frame)

    cap.release()
    cv2.destroyAllWindows()


def run_video(video_path, label, seq_len, skip, overlap, output_dir):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"[ERROR] Cannot open: {video_path}"); return

    step     = max(1, int(seq_len * (1 - overlap)))
    file_idx = next_index(label, output_dir)
    seq      = []
    frame_n  = 0
    saved    = 0

    print(f"\n[VIDEO]  {video_path}  label='{label}'  seq={seq_len}  overlap={int(overlap*100)}%\n")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        frame_n += 1
        if frame_n % skip != 0:
            continue
        _, flat = process_frame(cv2.flip(frame, 1))
        if flat:
            seq.append(flat)
        if len(seq) >= seq_len:
            save_sequence(seq[:seq_len], label, file_idx, output_dir)
            file_idx += 1
            saved    += 1
            seq       = seq[step:]

    cap.release()
    print(f"\nDone. {saved} sequence(s) saved.")


def run_images(image_folder, label, output_dir):
    paths = sorted(
        glob.glob(os.path.join(image_folder, '*.jpg'))  +
        glob.glob(os.path.join(image_folder, '*.jpeg')) +
        glob.glob(os.path.join(image_folder, '*.png'))
    )
    if not paths:
        print(f"[ERROR] No images found in: {image_folder}"); return

    print(f"\n[IMAGE]  {image_folder}  label='{label}'  {len(paths)} file(s)\n")

    landmarks = []
    for p in paths:
        frame    = cv2.imread(p)
        _, flat  = process_frame(frame) if frame is not None else (None, None)
        if flat:
            landmarks.append(flat)
        else:
            print(f"  [skip] {os.path.basename(p)}")

    if not landmarks:
        print("[ERROR] No valid landmarks extracted."); return

    data = np.array(landmarks)
    path = os.path.join(output_dir, f"sign_{label}_images.npy")
    os.makedirs(output_dir, exist_ok=True)
    np.save(path, data)
    print(f"\nSaved: {path}  shape: {data.shape}  ({len(landmarks)} ok / {len(paths)-len(landmarks)} skipped)")


# ── CLI ───────────────────────────────────────────────────────────────────────
def main():
    p = argparse.ArgumentParser(
        description='LinguSign — ASL data collection',
        formatter_class=argparse.RawTextHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python data_collection.py --mode webcam\n"
            "  python data_collection.py --mode video --input videos/sign_a.mp4 --label a\n"
            "  python data_collection.py --mode image --input images/a/ --label a"
        ))
    p.add_argument('--mode',         choices=['webcam','video','image'], default='webcam')
    p.add_argument('--input',  '-i', default=None)
    p.add_argument('--label',  '-l', default=None)
    p.add_argument('--seq',          type=int,   default=30)
    p.add_argument('--skip',         type=int,   default=2)
    p.add_argument('--overlap',      type=float, default=0.5)
    p.add_argument('--output', '-o', default='dataset')
    a = p.parse_args()

    if a.mode in ('video', 'image') and not (a.input and a.label):
        print(f"[ERROR] --mode {a.mode} requires --input and --label"); return

    {'webcam': lambda: run_webcam(a.seq, a.skip, a.output),
     'video':  lambda: run_video(a.input, a.label, a.seq, a.skip, a.overlap, a.output),
     'image':  lambda: run_images(a.input, a.label, a.output)}[a.mode]()


if __name__ == '__main__':
    main()