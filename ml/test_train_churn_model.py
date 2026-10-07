import unittest
from pathlib import Path

from train_churn_model import train_model


DATA = Path(__file__).parent / 'data'


class ChurnTrainerTests(unittest.TestCase):
    def test_trainer_fits_training_rows_and_evaluates_holdout_only(self):
        artifact = train_model(DATA / 'churn-bigml-80.csv', DATA / 'churn-bigml-20.csv')
        self.assertEqual(artifact['model']['trainingRows'], 2666)
        self.assertEqual(artifact['metrics']['holdoutRows'], 667)
        self.assertGreaterEqual(artifact['metrics']['accuracy'], 0)
        self.assertLessEqual(artifact['metrics']['accuracy'], 1)
        self.assertEqual(sum(artifact['confusionMatrix'].values()), 667)

    def test_probability_stays_bounded_for_unseen_categorical_values(self):
        artifact = train_model(DATA / 'churn-bigml-80.csv', DATA / 'churn-bigml-20.csv')
        probability, _ = artifact['predict']({'State': 'ZZ', 'Area code': '999', 'International plan': 'Yes', 'Voice mail plan': 'No', 'Account length': '100', 'Number vmail messages': '0', 'Total day minutes': '100', 'Total day calls': '50', 'Total day charge': '17', 'Total eve minutes': '100', 'Total eve calls': '50', 'Total eve charge': '8', 'Total night minutes': '100', 'Total night calls': '50', 'Total night charge': '5', 'Total intl minutes': '5', 'Total intl calls': '2', 'Total intl charge': '1', 'Customer service calls': '1'})
        self.assertGreaterEqual(probability, 0)
        self.assertLessEqual(probability, 1)


if __name__ == '__main__':
    unittest.main()
