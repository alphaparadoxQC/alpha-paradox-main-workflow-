import sys
from PySide6.QtWidgets import QApplication, QMainWindow
import os

print("Starting app...")
app = QApplication(sys.argv)
print("App created")
win = QMainWindow()
print("Window created")
win.show()
print("Window shown")
# we don't start the event loop to avoid hanging forever if it works, just exit after showing
sys.exit(0)
