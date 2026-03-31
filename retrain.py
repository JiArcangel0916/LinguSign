# Second Training Module (removed 1st training module due to additional image/video datasets)
import numpy as np
import os
import glob
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import SGDClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import make_pipeline
from sklearn.metrics import accuracy_score, classification_report

DATA_PATH  = 'dataset'
EXTRA_CSV  = 'dataset/extra_landmarks.csv'
MODEL_NAME = 'asl_model_v2.pkl'

def train():
    sequences, labels = [], []

    files = glob.glob(os.path.join(DATA_PATH, "*.npy"))
    if not files:
        print(" No .npy files found — proceeding with extra data only.")
    else:
        print(f"Loading {len(files)} .npy files...")
        for file in files:
            data = np.load(file)
            label = os.path.basename(file).split('_')[1][0]

            if data.ndim == 2:
                data = data[::2]

            for frame in data:
                sequences.append(frame)
                labels.append(label)
                # Make mirrored version of each dataset (para pwedeng left/right hand signs)
                mirrored = frame.copy()
                mirrored[0::3] *= -1
                sequences.append(mirrored)
                labels.append(label)

        print(f"  From .npy: {len(sequences):,} samples")

    if os.path.exists(EXTRA_CSV):
        print(f"\nLoading extra landmarks from CSV...")
        df = pd.read_csv(EXTRA_CSV, header=None)
        X_extra = df.iloc[:, :-1].values
        y_extra = df.iloc[:, -1].str.lower().values

        for i in range(len(X_extra)):
            sequences.append(X_extra[i])
            labels.append(y_extra[i])
            # Make mirrored version of each dataset (para pwedeng left/right hand signs)
            mirrored = X_extra[i].copy()
            mirrored[0::3] *= -1
            sequences.append(mirrored)
            labels.append(y_extra[i])

        print(f"  From CSV : {len(X_extra):,} samples (+{len(X_extra):,} mirrored)")
    else:
        print(f"{EXTRA_CSV} not found.")

    if not sequences:
        print("No data to train on. Exiting.")
        return

    X = np.array(sequences)
    y = np.array(labels)

    print(f"\nTotal samples : {len(X):,}")
    print(f"Features      : {X.shape[1]}")

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    print(f"Classes       : {list(label_encoder.classes_)}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    print(f"Train : {len(X_train):,} | Test : {len(X_test):,}")

    print("\nTraining SGD Classifier...")
    model = make_pipeline(
        StandardScaler(),
        SGDClassifier(loss='modified_huber', penalty='l2', max_iter=1000, tol=1e-3)
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred) * 100
    print(f"\nAccuracy: {acc:.2f}%")
    print("\nReport:")
    print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

    joblib.dump({'classifier': model, 'label_encoder': label_encoder}, MODEL_NAME)
    print(f"✅ Saved to {MODEL_NAME}")

if __name__ == "__main__":
    train()