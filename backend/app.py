import os
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import traceback

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def get_df(filename):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if not os.path.exists(file_path):
        return None
    if filename.endswith('.csv'):
        return pd.read_csv(file_path)
    elif filename.endswith(('.xls', '.xlsx')):
        return pd.read_excel(file_path)
    return None

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and file.filename.endswith(('.csv', '.xls', '.xlsx')):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        try:
            df = get_df(filename)
            if df is None:
                return jsonify({'error': 'Could not read file'}), 400
                
            # Basic info
            rows, cols = df.shape
            preview = df.head(10).fillna("").to_dict(orient='records')
            columns = df.columns.tolist()
            
            return jsonify({
                'message': 'File uploaded successfully',
                'filename': filename,
                'rows': rows,
                'columns': cols,
                'columns_list': columns,
                'preview': preview
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/api/analyze/<filename>', methods=['GET'])
def analyze_file(filename):
    df = get_df(filename)
    if df is None:
        return jsonify({'error': 'File not found or unreadable'}), 404
        
    try:
        # Data Cleaning Stats
        duplicates = int(df.duplicated().sum())
        null_counts = df.isnull().sum().to_dict()
        total_nulls = sum(null_counts.values())
        
        # Identify numeric and categorical columns
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
        
        insights = []
        charts_data = {}
        chart_suggestions = []
        
        # Generate simple insights
        if numeric_cols:
            for col in numeric_cols[:2]:  # Take up to 2 numeric cols for insights
                max_val = df[col].max()
                min_val = df[col].min()
                mean_val = df[col].mean()
                insights.append(f"The highest {col} is {max_val:.2f}.")
                insights.append(f"The average {col} is {mean_val:.2f}.")
                
        if categorical_cols:
            for col in categorical_cols[:1]:
                top_cat = df[col].mode()
                if not top_cat.empty:
                    insights.append(f"The most frequent {col} is '{top_cat[0]}'.")
                    
        if not insights:
            insights.append("Uploaded dataset contains sufficient data for basic analysis.")
            
        # Smart Chart Suggestions & Data Generation
        # Let's try to find a label column (categorical) and a value column (numeric)
        label_col = categorical_cols[0] if categorical_cols else (df.columns[0] if len(df.columns) > 0 else None)
        value_col = numeric_cols[0] if numeric_cols else (df.columns[1] if len(df.columns) > 1 else None)
        
        if label_col and value_col and label_col != value_col:
            # Group by label and sum/mean
            grouped = df.groupby(label_col)[value_col].sum().reset_index().head(10) # Top 10 for charts
            grouped = grouped.sort_values(by=value_col, ascending=False)
            chart_data = grouped.fillna("").to_dict(orient='records')
            
            charts_data['primary'] = {
                'data': chart_data,
                'xAxis': label_col,
                'yAxis': value_col
            }
            chart_suggestions = ["Bar Chart", "Pie Chart", "Line Chart", "Area Chart"]
        else:
            # Fallback if no clear categorization
            chart_suggestions = ["Simple Table", "Data Metrics"]
            
        return jsonify({
            'cleaning_stats': {
                'duplicates': duplicates,
                'total_nulls': total_nulls,
                'null_counts': {k: int(v) for k, v in null_counts.items() if v > 0}
            },
            'insights': insights,
            'chart_suggestions': chart_suggestions,
            'charts_data': charts_data
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/clean/<filename>', methods=['POST'])
def clean_file(filename):
    df = get_df(filename)
    if df is None:
        return jsonify({'error': 'File not found'}), 404
        
    try:
        # Remove duplicates
        df = df.drop_duplicates()
        
        # Handle missing values (fill numeric with mean, categorical with mode)
        numeric_cols = df.select_dtypes(include=['number']).columns
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns
        
        for col in numeric_cols:
            df[col] = df[col].fillna(df[col].mean())
        for col in categorical_cols:
            mode_val = df[col].mode()
            if not mode_val.empty:
                df[col] = df[col].fillna(mode_val[0])
                
        # Save cleaned file back
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if filename.endswith('.csv'):
            df.to_csv(file_path, index=False)
        else:
            df.to_excel(file_path, index=False)
            
        rows, cols = df.shape
        preview = df.head(10).fillna("").to_dict(orient='records')
            
        return jsonify({
            'message': 'Data cleaned successfully',
            'rows': rows,
            'columns': cols,
            'preview': preview
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    filename = data.get('filename')
    target_col = data.get('target_col')
    time_col = data.get('time_col') # or sequence col
    
    if not filename or not target_col:
        return jsonify({'error': 'Missing filename or target column'}), 400
        
    df = get_df(filename)
    if df is None:
        return jsonify({'error': 'File not found'}), 404
        
    try:
        if target_col not in df.columns:
            return jsonify({'error': 'Target column not found in data'}), 400
            
        df = df.dropna(subset=[target_col])
        y_list = df[target_col].tolist()
        
        if len(y_list) < 2:
            return jsonify({'error': 'Not enough data points to predict'}), 400
            
        # Simple linear regression using basic python math
        # If time_col is provided and numeric, use it. Otherwise use an index sequence.
        if time_col and time_col in df.columns and pd.api.types.is_numeric_dtype(df[time_col]):
            x = df[time_col].tolist()
        else:
            x = list(range(len(y_list)))
            
        # Calculate means
        mean_x = sum(x) / len(x)
        mean_y = sum(y_list) / len(y_list)
        
        # Calculate slope (m) and intercept (c)
        numerator = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y_list))
        denominator = sum((xi - mean_x) ** 2 for xi in x)
        
        m = numerator / denominator if denominator != 0 else 0
        c = mean_y - m * mean_x
        
        # Predict next 5 steps
        last_x = x[-1] if len(x) > 0 else 0
        step = (x[-1] - x[0]) / len(x) if len(x) > 1 else 1
        if step == 0: step = 1
        
        future_x = [last_x + i * step for i in range(1, 6)]
        future_y = [m * fx + c for fx in future_x]
        
        predictions = []
        for i in range(len(future_x)):
            predictions.append({
                'step': f"Future Step {i+1}",
                'predicted_value': round(float(future_y[i]), 2)
            })
            
        return jsonify({
            'predictions': predictions,
            'message': 'Prediction successful (Linear Regression)'
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
