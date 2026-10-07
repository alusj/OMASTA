"""Train a local, explainable baseline model from the fixed Kaggle churn split."""
import csv
import json
import math
from pathlib import Path


NUMERIC_FIELDS = [
    'Account length', 'Number vmail messages', 'Total day minutes', 'Total day calls',
    'Total day charge', 'Total eve minutes', 'Total eve calls', 'Total eve charge',
    'Total night minutes', 'Total night calls', 'Total night charge', 'Total intl minutes',
    'Total intl calls', 'Total intl charge', 'Customer service calls',
]
BOOLEAN_FIELDS = ['International plan', 'Voice mail plan']
CATEGORICAL_FIELDS = ['State', 'Area code']


def _number(value):
    return float(value or 0)


def _boolean(value):
    return 1.0 if str(value).strip().lower() in ('yes', 'true', '1') else 0.0


def _sigmoid(value):
    value = max(-35.0, min(35.0, value))
    return 1.0 / (1.0 + math.exp(-value))


def _read_rows(path):
    with Path(path).open(newline='', encoding='utf-8-sig') as source:
        return list(csv.DictReader(source))


def _build_schema(rows):
    means = {field: sum(_number(row[field]) for row in rows) / len(rows) for field in NUMERIC_FIELDS}
    scales = {}
    for field in NUMERIC_FIELDS:
        variance = sum((_number(row[field]) - means[field]) ** 2 for row in rows) / len(rows)
        scales[field] = math.sqrt(variance) or 1.0
    categories = {field: sorted({row[field] for row in rows}) for field in CATEGORICAL_FIELDS}
    feature_names = [f'numeric:{field}' for field in NUMERIC_FIELDS]
    feature_names += [f'boolean:{field}' for field in BOOLEAN_FIELDS]
    feature_names += [f'category:{field}={value}' for field in CATEGORICAL_FIELDS for value in categories[field]]
    return {'numericMeans': means, 'numericScales': scales, 'categories': categories, 'featureNames': feature_names}


def _vector(row, schema):
    values = [(_number(row.get(field)) - schema['numericMeans'][field]) / schema['numericScales'][field] for field in NUMERIC_FIELDS]
    values += [_boolean(row.get(field)) for field in BOOLEAN_FIELDS]
    values += [1.0 if row.get(field) == value else 0.0 for field in CATEGORICAL_FIELDS for value in schema['categories'][field]]
    return values


def _fit(vectors, labels, iterations=240, learning_rate=0.08, regularization=0.0001):
    weights = [0.0] * len(vectors[0])
    intercept = 0.0
    count = len(vectors)
    for _ in range(iterations):
        gradient = [0.0] * len(weights)
        intercept_gradient = 0.0
        for vector, label in zip(vectors, labels):
            error = _sigmoid(intercept + sum(weight * value for weight, value in zip(weights, vector))) - label
            intercept_gradient += error
            for index, value in enumerate(vector):
                gradient[index] += error * value
        intercept -= learning_rate * intercept_gradient / count
        for index in range(len(weights)):
            weights[index] -= learning_rate * (gradient[index] / count + regularization * weights[index])
    return intercept, weights


def _prediction_function(schema, intercept, weights):
    def predict(row):
        vector = _vector(row, schema)
        probability = _sigmoid(intercept + sum(weight * value for weight, value in zip(weights, vector)))
        contributions = sorted(
            ({'feature': feature, 'value': value * weight} for feature, value, weight in zip(schema['featureNames'], vector, weights)),
            key=lambda item: abs(item['value']), reverse=True,
        )
        return probability, contributions[:3]
    return predict


def train_model(train_path, holdout_path):
    training_rows = _read_rows(train_path)
    holdout_rows = _read_rows(holdout_path)
    if not training_rows or not holdout_rows:
        raise ValueError('Training and holdout datasets must both contain records.')
    schema = _build_schema(training_rows)
    vectors = [_vector(row, schema) for row in training_rows]
    labels = [1.0 if _boolean(row['Churn']) else 0.0 for row in training_rows]
    intercept, weights = _fit(vectors, labels)
    predict = _prediction_function(schema, intercept, weights)
    counts = {'truePositive': 0, 'falsePositive': 0, 'trueNegative': 0, 'falseNegative': 0}
    for row in holdout_rows:
        predicted = predict(row)[0] >= 0.5
        actual = bool(_boolean(row['Churn']))
        if predicted and actual:
            counts['truePositive'] += 1
        elif predicted:
            counts['falsePositive'] += 1
        elif actual:
            counts['falseNegative'] += 1
        else:
            counts['trueNegative'] += 1
    total = len(holdout_rows)
    accuracy = (counts['truePositive'] + counts['trueNegative']) / total
    precision_denominator = counts['truePositive'] + counts['falsePositive']
    recall_denominator = counts['truePositive'] + counts['falseNegative']
    artifact = {
        'schemaVersion': 1,
        'model': {'name': 'Logistic regression baseline', 'version': 'kaggle-bigml-v1', 'trainingRows': len(training_rows), 'threshold': 0.5, 'intercept': intercept, 'coefficients': weights},
        'featureNames': schema['featureNames'],
        'preprocessing': {key: schema[key] for key in ('numericMeans', 'numericScales', 'categories')},
        'metrics': {'holdoutRows': total, 'accuracy': accuracy, 'precision': counts['truePositive'] / precision_denominator if precision_denominator else 0.0, 'recall': counts['truePositive'] / recall_denominator if recall_denominator else 0.0},
        'confusionMatrix': counts,
    }
    artifact['predict'] = predict
    return artifact


def serialisable_artifact(artifact):
    return {key: value for key, value in artifact.items() if key != 'predict'}


if __name__ == '__main__':
    base = Path(__file__).parent
    artifact = train_model(base / 'data' / 'churn-bigml-80.csv', base / 'data' / 'churn-bigml-20.csv')
    output = base / 'model' / 'churn-prototype.json'
    output.parent.mkdir(exist_ok=True)
    output.write_text(json.dumps(serialisable_artifact(artifact), indent=2), encoding='utf-8')
    print(f'Wrote {output} with {artifact["model"]["trainingRows"]} training rows and {artifact["metrics"]["holdoutRows"]} holdout rows.')
