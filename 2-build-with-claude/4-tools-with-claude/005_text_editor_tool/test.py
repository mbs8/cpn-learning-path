import unittest
import math
from main import calculate_pi


class TestPiCalculation(unittest.TestCase):
    """Test cases for the calculate_pi function"""
    
    def test_pi_to_5_digits(self):
        """Test that pi is calculated accurately to 5 decimal places"""
        calculated_pi = calculate_pi(5)
        expected_pi = 3.14159  # Pi to 5 decimal places
        
        # Check if the result matches to 5 decimal places
        self.assertAlmostEqual(calculated_pi, expected_pi, places=5,
                              msg=f"Expected {expected_pi}, got {calculated_pi}")
    
    def test_pi_matches_math_library(self):
        """Test that our calculation is close to math.pi"""
        calculated_pi = calculate_pi(5)
        
        # Should be very close to the standard library value
        self.assertAlmostEqual(calculated_pi, math.pi, places=5,
                              msg=f"Expected {math.pi}, got {calculated_pi}")
    
    def test_pi_first_digit(self):
        """Test that the integer part is 3"""
        calculated_pi = calculate_pi(5)
        self.assertEqual(int(calculated_pi), 3,
                        msg=f"Integer part should be 3, got {int(calculated_pi)}")
    
    def test_pi_range(self):
        """Test that pi is in the expected range"""
        calculated_pi = calculate_pi(5)
        self.assertGreater(calculated_pi, 3.14159,
                          msg=f"Pi should be greater than 3.14159, got {calculated_pi}")
        self.assertLess(calculated_pi, 3.14160,
                       msg=f"Pi should be less than 3.14160, got {calculated_pi}")
    
    def test_higher_precision(self):
        """Test calculation with higher precision"""
        calculated_pi = calculate_pi(10)
        expected_pi = 3.1415926536  # Pi to 10 decimal places
        
        self.assertAlmostEqual(calculated_pi, expected_pi, places=9,
                              msg=f"Expected {expected_pi}, got {calculated_pi}")
    
    def test_return_type(self):
        """Test that the function returns a float"""
        result = calculate_pi(5)
        self.assertIsInstance(result, float,
                             msg=f"Expected float, got {type(result)}")


if __name__ == '__main__':
    # Run the tests
    unittest.main(verbosity=2)
