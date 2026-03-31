import numpy as np
import os
import glob
import joblib
from sklearn.model_selection import train_test_split
from sklearn.linear_model import SGDClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder

DATA_PATH = 'dataset'
MODEL_NAME = 'asl_model.pkl'

def train():
    sequences, labels = [], []
    
    files = glob.glob(os.path.join(DATA_PATH, "*.npy"))
    if not files:
        print("No data found.")
        return

    print("Loading and mirroring data...")
    for file in files:
        data = np.load(file)
        label = os.path.basename(file).split('_')[1][0]

        if data.ndim == 2:
            data = data[::2] 

        for frame in data:
            sequences.append(frame)
            labels.append(label)
            mirrored = frame.copy()
            mirrored[0::3] *= -1
            sequences.append(mirrored)
            labels.append(label)

    X = np.array(sequences)
    y = np.array(labels)

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )


    print("Training SGD Classifier...")
    model = make_pipeline(
        StandardScaler(),
        SGDClassifier(loss='modified_huber', penalty='l2', max_iter=1000, tol=1e-3)
    )
    
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print(f"\nAccuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%")
    print("\nReport:")
    print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

    joblib.dump({'classifier': model, 'label_encoder': label_encoder}, MODEL_NAME)
    print(f"Saved to {MODEL_NAME}")

if __name__ == "__main__":
    train()