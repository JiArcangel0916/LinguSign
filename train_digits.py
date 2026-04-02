# train_digits.py
# ---------------
# Trains a digits-only model (0-9) using the extracted digit landmarks.
# Saves the model as asl_model_digits.pkl.

import numpy as np
import os
import joblib
import pandas as pd
from sklearn.linear_model import SGDClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

DIGIT_CSV  = 'dataset/digit_landmarks.csv'
MODEL_NAME = 'asl_model_digits.pkl'

def mirror(frame):
    """Flip x-coordinates to support both left and right hand signing."""
    m = frame.copy()
    m[0::3] *= -1
    return m

def train():

    # ── 1. Load digit CSV ────────────────────────────────────────────────────
    if not os.path.exists(DIGIT_CSV) or os.path.getsize(DIGIT_CSV) == 0:
        print(f"Error: {DIGIT_CSV} not found or empty.")
        print("Run extract_digits.py first.")
        return

    print(f"Loading {DIGIT_CSV}...")
    df = pd.read_csv(DIGIT_CSV, header=None)
    print(f"  Raw samples : {len(df):,}")
    print(f"  Classes     : {sorted(df.iloc[:, -1].unique())}")

    # ── 2. Build dataset with mirroring — use ALL samples, no cap ────────────
    print("\nBuilding dataset with mirroring (using all available samples)...")
    data_by_label = {}

    for label in df.iloc[:, -1].unique():
        subset   = df[df.iloc[:, -1] == label].iloc[:, :-1].values
        mirrored = np.array([mirror(row) for row in subset])
        combined = np.vstack([subset, mirrored])
        data_by_label[label.lower()] = combined
        print(f"  {label} : {len(combined):,} samples (original + mirrored)")

    # ── 3. Find the max class size for balancing ─────────────────────────────
    max_samples = max(len(v) for v in data_by_label.values())
    print(f"\nLargest class : {max_samples:,} samples")
    print(f"Oversampling all classes to match largest class...")

    all_X, all_y = [], []
    for label, samples in sorted(data_by_label.items()):
        n = len(samples)

        if n < max_samples:
            # Oversample minority classes to match the largest class
            idx     = np.random.RandomState(42).choice(n, max_samples, replace=True)
            samples = samples[idx]

        # No downsampling — keep all samples if already at max
        all_X.append(samples)
        all_y.extend([label] * len(samples))
        print(f"  {label} : {len(samples):,} samples")

    X = np.vstack(all_X)
    y = np.array(all_y)

    # Shuffle
    perm = np.random.RandomState(42).permutation(len(X))
    X, y = X[perm], y[perm]

    print(f"\nTotal samples : {len(X):,}")

    # ── 4. Encode labels ─────────────────────────────────────────────────────
    label_encoder = LabelEncoder()
    y_encoded     = label_encoder.fit_transform(y)
    print(f"Classes       : {list(label_encoder.classes_)}")

    # ── 5. Train/test split ──────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    print(f"Train : {len(X_train):,} | Test : {len(X_test):,}")

    # ── 6. Train ─────────────────────────────────────────────────────────────
    print("\nTraining digits-only SGD Classifier...")
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

    # ── 7. Evaluate ──────────────────────────────────────────────────────────
    y_pred = model.predict(X_test)
    acc    = accuracy_score(y_test, y_pred) * 100

    print(f"\nAccuracy : {acc:.2f}%")
    print("\nReport:")
    print(classification_report(
        y_test, y_pred,
        target_names=label_encoder.classes_,
        zero_division=0
    ))

    # ── 8. Save ──────────────────────────────────────────────────────────────
    joblib.dump({'classifier': model, 'label_encoder': label_encoder}, MODEL_NAME)
    print(f"✅ Saved to {MODEL_NAME}")

if __name__ == "__main__":
    train()