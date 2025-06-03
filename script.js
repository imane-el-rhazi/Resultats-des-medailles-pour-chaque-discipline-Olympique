// ----------------------------------------------
// script.js (version améliorée)
// ----------------------------------------------

/*
  - On stocke chaque Chart dans l’objet `charts` (évite le conflit window[id]).
  - On utilise chartjs-plugin-datalabels pour afficher la valeur sur chaque barre.
  - On trie automatiquement les bar charts (disciplines & pays) par nombre décroissant.
  - On ajoute des titres d’axes (via options.scales).
  - On personnalise les couleurs / hover / épaisseurs.
*/

const charts = {};
let map;

let athletesData = [];
let medalsData = [];

// Liaison des inputs
document
  .getElementById('uploadAthletes')
  .addEventListener('change', handleAthleteUpload);
document
  .getElementById('uploadMedals')
  .addEventListener('change', handleMedalUpload);

/**
 * Lecture du CSV des athlètes (point‐virgule)
 */
function handleAthleteUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    delimiter: ';',
    complete: function (results) {
      athletesData = results.data;
      updateVisualisations();
    }
  });
}

/**
 * Lecture du CSV des médailles
 * (délimiteur par défaut = virgule, 
 *  si besoin : delimiter: ';')
 */
function handleMedalUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    // Si votre medals.csv est en “;”, décommentez :
    // delimiter: ';',
    complete: function (results) {
      medalsData = results.data;
      updateVisualisations();
    }
  });
}

/**
 * Mise à jour de tous les graphiques et de la carte
 */
function updateVisualisations() {
  if (athletesData.length === 0 || medalsData.length === 0) {
    return;
  }

  // --------------------------
  // 1) Médailles par discipline
  // --------------------------
  {
    const disciplinesCount = {};
    medalsData.forEach(row => {
      const d = row.Discipline;
      if (d) {
        disciplinesCount[d] = (disciplinesCount[d] || 0) + 1;
      }
    });
    // Tri décroissant
    const sortedDisciplines = Object.entries(disciplinesCount)
      .sort((a, b) => b[1] - a[1]);
    const labelsDisc = sortedDisciplines.map(item => item[0]);
    const valuesDisc = sortedDisciplines.map(item => item[1]);

    renderBarChart(
      'chartDiscipline',
      labelsDisc,
      valuesDisc,
      'Médailles par discipline'
    );
  }

  // --------------------------
  // 2) Médailles par pays
  // --------------------------
  {
    const countriesCount = {};
    medalsData.forEach(row => {
      const c = row.Country;
      if (c) {
        countriesCount[c] = (countriesCount[c] || 0) + 1;
      }
    });
    // Tri décroissant
    const sortedCountries = Object.entries(countriesCount)
      .sort((a, b) => b[1] - a[1]);
    const labelsCountry = sortedCountries.map(item => item[0]);
    const valuesCountry = sortedCountries.map(item => item[1]);

    renderBarChart(
      'chartCountry',
      labelsCountry,
      valuesCountry,
      'Médailles par pays'
    );
  }

  // --------------------------
  // 3) Médailles par type (pie chart)
  // --------------------------
  {
    const typesCount = { 'Gold Medal': 0, 'Silver Medal': 0, 'Bronze Medal': 0 };
    medalsData.forEach(row => {
      const t = row.Medal_type;
      if (typesCount.hasOwnProperty(t)) {
        typesCount[t]++;
      }
    });
    const labelsType = Object.keys(typesCount);
    const valuesType = Object.values(typesCount);

    renderPieChart(
      'chartType',
      labelsType,
      valuesType,
      'Répartition des types de médailles'
    );
  }

  // --------------------------
  // 4) Évolution des médailles par date
  // --------------------------
  {
    const datesCount = {};
    medalsData.forEach(row => {
      const date = row.Medal_date; // "jj/mm/aaaa"
      if (date) {
        datesCount[date] = (datesCount[date] || 0) + 1;
      }
    });
    // Tri par date (transforme "jj/mm/aaaa" en Date JS)
    const sortedDates = Object.keys(datesCount).sort((a, b) => {
      const [aj, am, ay] = a.split('/');
      const [bj, bm, by] = b.split('/');
      const da = new Date(`20${ay}`, am - 1, aj);
      const db = new Date(`20${by}`, bm - 1, bj);
      return da - db;
    });
    const valuesDates = sortedDates.map(d => datesCount[d]);

    renderLineChart(
      'chartDate',
      sortedDates,
      valuesDates,
      'Médailles par date'
    );
  }

  // --------------------------
  // 5) Médailles de la France uniquement (bar chart)
  // --------------------------
  {
    const franceCount = {};
    medalsData
      .filter(row => row.Country === 'France')
      .forEach(row => {
        const d = row.Discipline;
        if (d) {
          franceCount[d] = (franceCount[d] || 0) + 1;
        }
      });
    const sortedFrance = Object.entries(franceCount)
      .sort((a, b) => b[1] - a[1]);
    const labelsFrance = sortedFrance.map(item => item[0]);
    const valuesFrance = sortedFrance.map(item => item[1]);

    renderBarChart(
      'chartFrance',
      labelsFrance,
      valuesFrance,
      'Médailles françaises par discipline'
    );
  }

  // --------------------------
  // 6) Répartition par genre (bar chart)
  // --------------------------
  {
    const gendersCount = { Homme: 0, Femme: 0 };
    athletesData.forEach(row => {
      const genre = row.Genre; // "Homme" ou "Femme"
      const totalMedals =
        (parseInt(row["Médailles d'or"], 10) || 0) +
        (parseInt(row["Médailles d'argent"], 10) || 0) +
        (parseInt(row["Médailles de bronze"], 10) || 0);
      if (gendersCount.hasOwnProperty(genre)) {
        gendersCount[genre] += totalMedals;
      }
    });
    const labelsGender = Object.keys(gendersCount);
    const valuesGender = Object.values(gendersCount);

    renderBarChart(
      'chartGender',
      labelsGender,
      valuesGender,
      'Répartition des médailles par genre'
    );
  }

  // --------------------------
  // 7) Répartition par tranche d'âge (bar chart)
  // --------------------------
  {
    const ageGroupsCount = { '≤20': 0, '21-25': 0, '26-30': 0, '31-35': 0, '≥36': 0 };
    athletesData.forEach(row => {
      const age = parseInt(row['Âge'], 10);
      const totalMedals =
        (parseInt(row["Médailles d'or"], 10) || 0) +
        (parseInt(row["Médailles d'argent"], 10) || 0) +
        (parseInt(row["Médailles de bronze"], 10) || 0);
      if (!isNaN(age)) {
        if (age <= 20) ageGroupsCount['≤20'] += totalMedals;
        else if (age <= 25) ageGroupsCount['21-25'] += totalMedals;
        else if (age <= 30) ageGroupsCount['26-30'] += totalMedals;
        else if (age <= 35) ageGroupsCount['31-35'] += totalMedals;
        else ageGroupsCount['≥36'] += totalMedals;
      }
    });
    const labelsAge = Object.keys(ageGroupsCount);
    const valuesAge = Object.values(ageGroupsCount);

    renderBarChart(
      'chartAge',
      labelsAge,
      valuesAge,
      'Répartition des médailles par âge'
    );
  }

  // --------------------------
  // 8) Carte des sites de compétition
  // --------------------------
  if (map) {
    map.remove();
  }
  map = L.map('map').setView([48.85, 2.35], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  athletesData.forEach(row => {
    const lat = parseFloat(row.Latitude);
    const lon = parseFloat(row.Longitude);
    if (!isNaN(lat) && !isNaN(lon)) {
      const totalMedals =
        (parseInt(row["Médailles d'or"], 10) || 0) +
        (parseInt(row["Médailles d'argent"], 10) || 0) +
        (parseInt(row["Médailles de bronze"], 10) || 0);
      if (totalMedals > 0) {
        L.marker([lat, lon])
          .addTo(map)
          .bindPopup(
            '<strong>' + row.nom + '</strong><br>' +
            row.Discipline + '<br>' +
            'Médaille(s) : ' + totalMedals
          );
      }
    }
  });
}

/**
 * Render d’un bar chart Chart.js avec :
 *  - tri déjà appliqué avant appel ➔ labels et data sont déjà dans l’ordre souhaité
 *  - options d’affichage des valeurs (plugin datalabels)
 *  - titres d’axes
 */
function renderBarChart(id, labels, data, title) {
  const ctx = document.getElementById(id).getContext('2d');
  if (charts[id]) {
    charts[id].destroy();
  }
  charts[id] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: data,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(54, 162, 235, 0.9)'
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 18 }
        },
        legend: { display: false },
        datalabels: {
          color: '#000',
          anchor: 'end',
          align: 'top',
          font: { weight: 'bold' },
          formatter: value => value
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Catégorie',
            font: { size: 14 }
          },
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          title: {
            display: true,
            text: 'Nombre de médailles',
            font: { size: 14 }
          },
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

/**
 * Render d’un pie chart Chart.js avec couleurs personnalisées
 */
function renderPieChart(id, labels, data, title) {
  const ctx = document.getElementById(id).getContext('2d');
  if (charts[id]) {
    charts[id].destroy();
  }
  // Palette manuelle pour 3 types
  const palette = ['gold', 'silver', '#cd7f32'];
  charts[id] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: data,
        backgroundColor: palette,
        borderColor: '#fff',
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 18 }
        },
        legend: {
          position: 'bottom'
        },
        datalabels: {
          color: '#fff',
          formatter: (value, ctx) => {
            let percentage = (value / ctx.dataset.data.reduce((a, b) => a + b)) * 100;
            return percentage.toFixed(0) + '%';
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

/**
 * Render d’un line chart Chart.js avec style plus épais et points visibles
 */
function renderLineChart(id, labels, data, title) {
  const ctx = document.getElementById(id).getContext('2d');
  if (charts[id]) {
    charts[id].destroy();
  }
  charts[id] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: title,
        data: data,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 3,
        pointRadius: 5,
        pointBackgroundColor: 'rgb(255, 99, 132)',
        fill: true,
        tension: 0.2
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 18 }
        },
        legend: { position: 'top' },
        datalabels: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: context => context.parsed.y + ' médailles'
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date (jj/mm/aaaa)',
            font: { size: 14 }
          },
          ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 }
        },
        y: {
          title: {
            display: true,
            text: 'Nombre de médailles',
            font: { size: 14 }
          },
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}
