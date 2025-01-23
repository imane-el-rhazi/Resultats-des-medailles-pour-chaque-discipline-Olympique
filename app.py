import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import networkx as nx

# Charger les données
file_path = 'transactions.csv'  # Remplacez par votre chemin de fichier
data = pd.read_csv(file_path)

# 1. Histogramme des montants par type de transaction avec des couleurs personnalisées
plt.figure(figsize=(10, 6))
sns.histplot(data=data, x='amount', hue='type', kde=True, bins=30, palette='Set2')
plt.title('Distribution des montants par type de transaction', fontsize=14)
plt.xlabel('Montant', fontsize=12)
plt.ylabel('Fréquence', fontsize=12)
plt.grid(axis='y', linestyle='--', alpha=0.7)
plt.show()

# 2. Nombre de transactions par type avec annotations
plt.figure(figsize=(8, 5))
ax = data['type'].value_counts().plot(kind='bar', color=['#FF9999', '#66B2FF', '#99FF99', '#FFCC99', '#CCCCFF'])
plt.title('Nombre de transactions par type', fontsize=14)
plt.xlabel('Type de transaction', fontsize=12)
plt.ylabel('Nombre', fontsize=12)

# Ajouter des annotations
for i, v in enumerate(data['type'].value_counts()):
    plt.text(i, v + 50, str(v), ha='center', fontsize=10, color='black')

plt.grid(axis='y', linestyle='--', alpha=0.7)
plt.show()

# 3. Diagramme de réseau entre nameOrig et nameDest avec taille et couleur des nœuds reflétant les montants
# Limiter le graphe à un sous-ensemble pour lisibilité
subset = data.head(50)  # Prenez les 50 premières lignes pour simplifier

# Créer un graphe
G = nx.from_pandas_edgelist(subset, source='nameOrig', target='nameDest', edge_attr='amount')

# Taille des nœuds proportionnelle au degré (nombre de connexions)
node_sizes = [G.degree(node) * 100 for node in G.nodes()]

# Couleur des nœuds : plus sombre si degré élevé
node_colors = [G.degree(node) for node in G.nodes()]

# Dessiner le graphe
plt.figure(figsize=(12, 8))
pos = nx.spring_layout(G, seed=42)  # Positionnement des nœuds

nx.draw_networkx_nodes(G, pos, node_size=node_sizes, node_color=node_colors, cmap=plt.cm.Blues, alpha=0.8)
nx.draw_networkx_edges(G, pos, edge_color='gray', alpha=0.5)

# Ajouter les labels pour les nœuds les plus connectés
labels = {node: node for node in G.nodes() if G.degree(node) > 1}
nx.draw_networkx_labels(G, pos, labels, font_size=8, font_color='darkred')

plt.title('Réseau des transactions (tailles et couleurs selon les connexions)', fontsize=14)
plt.colorbar(plt.cm.ScalarMappable(cmap=plt.cm.Blues), label="Degré des nœuds")
plt.show()
