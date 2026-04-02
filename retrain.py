# retrain.py
# ----------
# Third Training Module - Letters (A-Z) + Digits (0-9)
# Uses separate sample caps for letters and digits to maintain
# high letter accuracy while maximizing the smaller digit dataset.

import numpy as np
import os
import glob
import joblib
import pandas as pd
from sklearn.linear_model import SGDClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.utils import resample

DATA_PATH      = 'dataset'
MODEL_NAME     = 'asl_model_v3.pkl'
LETTER_SAMPLES = 10000   
DIGIT_SAMPLES  = 3000  

EXTRA_CSVS = [
    'dataset/extra_landmarks.csv',   # A-Z letters from Kaggle
    'dataset/digit_landmarks.csv',   # 0-9 digits from Kaggle
]

def mirror(frame):
    """Flip x-coordinates to support both left and right hand signing."""
    m = frame.copy()
    m[0::3] *= -1
    return m

def train():

    data_by_label = {}

    files = glob.glob(os.path.join(DATA_PATH, "*.npy"))
    if files:
        print(f"Loading {len(files)} .npy files...")
        npy_count = 0
        for file in files:
            data  = np.load(file)
            label = os.path.basename(file).split('_')[1][0]
            if data.ndim == 2:
                data = data[::2]

            if label not in data_by_label:
                data_by_label[label] = []

            for frame in data:
                data_by_label[label].append(frame)
                data_by_label[label].append(mirror(frame))
                npy_count += 2

        print(f"  From .npy : {npy_count:,} samples")
    else:
        print("  No .npy files found.")

    for csv_path in EXTRA_CSVS:
        if not os.path.exists(csv_path) or os.path.getsize(csv_path) == 0:
            print(f"  Skipping: {csv_path}")
            continue

        print(f"Loading {os.path.basename(csv_path)}...")
        csv_count = 0

        for chunk in pd.read_csv(csv_path, header=None, chunksize=10000):
            X_chunk = chunk.iloc[:, :-1].values
            y_chunk = chunk.iloc[:, -1].str.lower().values

            for i in range(len(X_chunk)):
                label = y_chunk[i]
                if label not in data_by_label:
                    data_by_label[label] = []
                data_by_label[label].append(X_chunk[i])
                data_by_label[label].append(mirror(X_chunk[i]))
                csv_count += 2

        print(f"  Added : {csv_count:,} samples")

    total_before = sum(len(v) for v in data_by_label.values())
    print(f"\nTotal before balancing : {total_before:,}")

    print(f"\nBalancing classes...")
    print(f"  Letters cap : {LETTER_SAMPLES:,} samples each")
    print(f"  Digits cap  : {DIGIT_SAMPLES:,} samples each")

    all_X, all_y = [], []

    for label in sorted(data_by_label.keys()):
        samples = np.array(data_by_label[label])
        cap     = DIGIT_SAMPLES if label.startswith('digit_') else LETTER_SAMPLES
        n       = len(samples)

        if n > cap:
            idx     = np.random.RandomState(42).choice(n, cap, replace=False)
            samples = samples[idx]
        elif n < cap:
            idx     = np.random.RandomState(42).choice(n, cap, replace=True)
            samples = samples[idx]

        tag = 'digit' if label.startswith('digit_') else 'letter'
        print(f"  {label:>10} ({tag}) : {len(samples):,} samples")

        all_X.append(samples)
        all_y.extend([label] * len(samples))

        data_by_label[label] = None

    print("\nStacking and shuffling...")
    X = np.vstack(all_X)
    y = np.array(all_y)

    rng  = np.random.RandomState(42)
    perm = rng.permutation(len(X))
    X, y = X[perm], y[perm]

    letters_total = np.sum(~np.char.startswith(y, 'digit_'))
    digits_total  = np.sum(np.char.startswith(y, 'digit_'))
    print(f"Total after balancing  : {len(X):,}")
    print(f"  Letters : {letters_total:,} samples")
    print(f"  Digits  : {digits_total:,} samples")

    label_encoder = LabelEncoder()
    y_encoded     = label_encoder.fit_transform(y)

    letters = [c for c in label_encoder.classes_ if not c.startswith('digit_')]
    digits  = [c for c in label_encoder.classes_ if c.startswith('digit_')]
    print(f"\n  Letters ({len(letters)}) : {letters}")
    print(f"  Digits  ({len(digits)})  : {[d.replace('digit_','') for d in digits]}")
    print(f"  Total classes : {len(label_encoder.classes_)}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    print(f"\nTrain : {len(X_train):,} | Test : {len(X_test):,}")

    print("\nTraining SGD Classifier...")
    model = make_pipeline(
        StandardScaler(),
        SGDClassifier(
            loss='modified_huber',
            penalty='l2',
            max_iter=1000,
            tol=1e-3,
            random_state=42,
            n_jobs=-1
        )
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc    = accuracy_score(y_test, y_pred) * 100

    print(f"\nAccuracy : {acc:.2f}%")
    print("\nReport:")
    print(classification_report(
        y_test, y_pred,
        target_names=label_encoder.classes_,
        zero_division=0
    ))

    joblib.dump({'classifier': model, 'label_encoder': label_encoder}, MODEL_NAME)
    print(f" Saved to {MODEL_NAME}")

if __name__ == "__main__":
    train()