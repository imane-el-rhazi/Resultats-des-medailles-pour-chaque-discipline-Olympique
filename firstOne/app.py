from flask import Flask, render_template, send_file
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import networkx as nx
import os

# Initialisation de l'application Flask
app = Flask(__name__)

# Charger les données
file_path = 'data/transactions.csv'  # Chemin vers le fichier CSV
data = pd.read_csv(file_path)

# Fonction pour générer les graphes
def generate_graphs():
    # Créer un répertoire pour stocker les graphes si nécessaire
    if not os.path.exists('static'):
        os.makedirs('static')

    # 1. Histogramme des montants par type de transaction
    hist_path = 'static/histogram.png'
    plt.figure(figsize=(12, 7))
    sns.histplot(data=data, x='amount', hue='type', kde=True, bins=30, palette='viridis', alpha=0.8)
    plt.title('Distribution des montants par type de transaction', fontsize=16, fontweight='bold')
    plt.xlabel('Montant', fontsize=14)
    plt.ylabel('Fréquence', fontsize=14)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.savefig(hist_path)
    plt.close()

    # 2. Graphique à barres avec annotations
    bar_path = 'static/bar_chart.png'
    plt.figure(figsize=(10, 6))
    type_counts = data['type'].value_counts()
    ax = type_counts.plot(kind='bar', color=sns.color_palette('cool', len(type_counts)), edgecolor='black')
    plt.title('Nombre de transactions par type', fontsize=16, fontweight='bold')
    plt.xlabel('Type de transaction', fontsize=14)
    plt.ylabel('Nombre', fontsize=14)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.savefig(bar_path)
    plt.close()

    # 3. Diagramme de réseau
    network_path = 'static/network_graph.png'
    subset = data.head(100)  # Sous-ensemble pour une visualisation lisible
    G = nx.from_pandas_edgelist(subset, source='nameOrig', target='nameDest', edge_attr='amount')
    plt.figure(figsize=(14, 10))
    pos = nx.spring_layout(G, seed=42, k=0.3)
    nx.draw(G, pos, with_labels=False, node_size=20, edge_color='gray', alpha=0.7)
    plt.title('Réseau des transactions', fontsize=16, fontweight='bold')
    plt.tight_layout()
    plt.savefig(network_path)
    plt.close()

    # 4. Graphique des transactions frauduleuses par type
    fraud_type_path = 'static/fraud_type_chart.png'
    plt.figure(figsize=(10, 6))
    fraud_data = data[data['isFraud'] == 1]  # Filtrer les transactions frauduleuses
    fraud_type_counts = fraud_data['type'].value_counts()
    ax = fraud_type_counts.plot(kind='bar', color=sns.color_palette('magma', len(fraud_type_counts)), edgecolor='black')
    plt.title('Transactions Frauduleuses par Type de Paiement', fontsize=16, fontweight='bold')
    plt.xlabel('Type de Paiement', fontsize=14)
    plt.ylabel('Nombre de Transactions Frauduleuses', fontsize=14)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.tight_layout()
    plt.savefig(fraud_type_path)
    plt.close()

    return hist_path, bar_path, network_path, fraud_type_path

# Route principale
@app.route('/')
def index():
    hist_path, bar_path, network_path, fraud_type_path = generate_graphs()
    return render_template('index.html', 
                           hist_path=hist_path, 
                           bar_path=bar_path, 
                           network_path=network_path,
                           fraud_type_path=fraud_type_path)

# Lancer l'application Flask
if __name__ == '__main__':
    app.run(debug=True)
