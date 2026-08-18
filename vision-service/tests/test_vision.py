import unittest
import sys
import os

# Adjust path to import app module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.validator import clean_field, clean_list_field, is_placeholder, calculate_field_confidence

class TestVisionValidator(unittest.TestCase):
    def test_placeholder_blocking(self):
        self.assertTrue(is_placeholder("Academic Event"))
        self.assertTrue(is_placeholder("Seminar Hall"))
        self.assertTrue(is_placeholder("Guest Speaker"))
        self.assertTrue(is_placeholder("15 October 2026"))
        self.assertFalse(is_placeholder("Annual Science Symposium"))

    def test_clean_field(self):
        self.assertEqual(clean_field("  Valid Title  "), "Valid Title")
        self.assertEqual(clean_field("Guest Speaker"), "")
        self.assertEqual(clean_field(None), "")

    def test_clean_list_field(self):
        self.assertEqual(clean_list_field(["Item 1", "Guest Speaker", None]), ["Item 1"])
        self.assertEqual(clean_list_field("Line 1\nLine 2"), ["Line 1", "Line 2"])

    def test_calculate_confidence(self):
        self.assertEqual(calculate_field_confidence("title", ""), 0.0)
        self.assertGreater(calculate_field_confidence("speaker", "Dr. Arun Kumar"), 0.8)

if __name__ == "__main__":
    unittest.main()
