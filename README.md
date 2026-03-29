
# 👋 LinguHand

A web application for ASL Learning
## To run data_collection.py

1. Download the files or clone the repository
- Download the ZIP or
- Run this in your terminal in a new directory 
```
  git clone https://github.com/JiArcangel0916/LinguSign.git
```

3. Once opened in your code editor, create a virtual environment and activate it
```
    python -m venv venv
    venv/Scripts/activate
```

you should see something like this after in your terminal:
```
  (venv) PS C:\Users\...
```

4. Install the dependencies for the data collection
```
    pip install -r requirements.txt
```

5. Run the python file:
```
  python data_collection.py
```
Once the camera is running the controls are displayed:
- Pressing `.` terminates the program
- Pressing `any alphabet` starts the recording

**Make sure your hand is being detected by the program (you will see hand landmarks drawn)**

6. After recording for 30 frames (1-3 seconds), an `.npy` file will be saved with the character pressed and the count.
**If the program is ran again, the count would start to 0, overwriting of datasets may occur if datasets are already created**

7. You should see something like this after recording is saved:
```
sign_a1.npy
```

8. Upload the .npy files in after creating your respective folders here: 
```
https://drive.google.com/drive/folders/123PmEsDpcEyJsJDNEv22vtNq-AXG-kzQ?usp=sharing
```