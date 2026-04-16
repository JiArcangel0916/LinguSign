# 👋 Samplingo

A web application for ASL Learning using MediaPipe and SVM.

## 🚀 Setup and Installation

1. **Clone the repository**
   Run this in your terminal to download the project:
   ```
   git clone https://github.com/JiArcangel0916/LinguSign.git
   ```
2. Create and activate a virtual environment
Open the folder in your code editor and run:

  ```
  python -m venv venv
  .\venv\Scripts\activate
  You should see (venv) appear in your terminal prompt.
  ```
3. Install dependencies
Install the required libraries for both data collection and detection:

  ```
pip install -r requirements.txt
  ```
## Running the Inference (Test)

To test the real-time ASL recognition, ensure you have the **pkl file** and **hand_landmarker.task** files in your root directory.

4. Run the inference file:
  ```
python inference.py
  ```
5. Controls:
  ```
Detection: A purple bounding box will appear when a hand is detected.
Prediction: The predicted letter and confidence score will appear above the box.
Exit: Press q to close the camera window.
  ```
