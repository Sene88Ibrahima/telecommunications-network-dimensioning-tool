import React, { useState, useEffect, useRef } from 'react';
import { 
  Container, Paper, Typography, Grid, Box, Button, 
  CircularProgress, Divider, FormControl, InputLabel,
  Select, MenuItem, TextField, Checkbox, FormControlLabel,
  Alert, Snackbar
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
// La bibliothèque docx n'est plus nécessaire car nous n'utilisons plus le format Word
import { saveAs } from 'file-saver';
import Chart from 'chart.js/auto';

const ReportGenerator = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Références pour les canvas des graphiques
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const [reportSettings, setReportSettings] = useState({
    title: '',
    includeParameters: true,
    includeResults: true,
    includeCharts: true,
    includeMapView: false,
    format: 'pdf',
    headerText: '',
    footerText: '',
  });

  // Pour stocker les données du résultat récupérées de l'API
  const [networkData, setNetworkData] = useState({
    id: '',
    type: '',
    title: '',
    createdAt: '',
    projectId: '',
    projectName: '',
    parameters: {},
    results: {}
  });

  // In a real implementation, this would fetch the actual result
  // Initialisation des graphiques pour le rapport PDF
  useEffect(() => {
    if (!loading && result) {
      // Détruire les graphiques existants s'ils existent
      const destroyCharts = () => {
        if (barChartRef.current?.chart) {
          barChartRef.current.chart.destroy();
          barChartRef.current.chart = null;
        }
        if (pieChartRef.current?.chart) {
          pieChartRef.current.chart.destroy();
          pieChartRef.current.chart = null;
        }
      };
      
      // Créer les graphiques avec un délai pour s'assurer que les canvas sont prêts
      setTimeout(() => {
        if (barChartRef.current && pieChartRef.current) {
          destroyCharts();
        
        // Graphique à barres
        const barCtx = barChartRef.current.getContext('2d');
        barChartRef.current.chart = new Chart(barCtx, {
          type: 'bar',
          data: {
            labels: ['Capacité', 'Couverture'],
            datasets: [{
              label: 'Répartition',
              data: [25, 75],
              backgroundColor: [
                'rgba(41, 128, 185, 0.8)',
                'rgba(46, 204, 113, 0.8)'
              ],
              borderColor: [
                'rgba(41, 128, 185, 1)',
                'rgba(46, 204, 113, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Capacité vs Couverture'
              }
            }
          }
        });
        
        // Graphique en secteurs
        const pieCtx = pieChartRef.current.getContext('2d');
        pieChartRef.current.chart = new Chart(pieCtx, {
          type: 'pie',
          data: {
            labels: ['Zone Urbaine', 'Zone Suburbaine', 'Zone Rurale'],
            datasets: [{
              label: 'Distribution des BTS',
              data: [18, 7, 3],
              backgroundColor: [
                'rgba(41, 128, 185, 0.8)',
                'rgba(46, 204, 113, 0.8)',
                'rgba(231, 76, 60, 0.8)'
              ],
              borderColor: [
                'rgba(41, 128, 185, 1)',
                'rgba(46, 204, 113, 1)',
                'rgba(231, 76, 60, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Distribution des BTS'
              }
            }
          }
        });
      }
      }, 100); // Délai de 100ms pour s'assurer que les canvas sont prêts
      
      return destroyCharts;
    }
  }, [loading, result]);
  
  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        
        // Récupérer les données réelles depuis l'API
        const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/api/results/${resultId}`);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Stocker les données récupérées
        setNetworkData(data);
        setResult(data); // Pour compatibilité avec le code existant
        
        // Définir un titre par défaut pour le rapport basé sur le type de réseau réel
        setReportSettings(prev => ({
          ...prev,
          title: `Rapport - Dimensionnement ${data.type.toUpperCase()} - ${data.projectName}`
        }));
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching result:', error);
        setError(`Erreur lors de la récupération des résultats: ${error.message}`);
        setLoading(false);
        
        // En cas d'erreur, utiliser des données par défaut pour éviter les crashs
        const defaultData = {
          id: resultId || 'unknown',
          type: 'unknown',
          title: 'Dimensionnement - Données non disponibles',
          createdAt: new Date().toISOString(),
          projectId: 'unknown',
          projectName: 'Projet inconnu',
          parameters: {},
          results: {}
        };
        
        setNetworkData(defaultData);
        setResult(defaultData);
      }
    };
    
    if (resultId) {
      fetchResult();
    } else {
      setError('ID de résultat non spécifié');
      setLoading(false);
    }
  }, [resultId]);

  const handleSettingsChange = (event) => {
    const { name, value, checked } = event.target;
    setReportSettings(prev => ({
      ...prev,
      [name]: event.target.type === 'checkbox' ? checked : value
    }));
  };
  
  // Fonction principale pour générer le rapport selon le format sélectionné
  const handleGenerateReport = async () => {
    setGenerating(true);
    setError(null);
    setSuccess(false);
    setSuccessMessage('');
    
    try {
      let result;
      
      // Générer le rapport selon le format sélectionné
      if (reportSettings.format === 'excel') {
        result = await generateExcelReport();
        setSuccessMessage(`Rapport Excel généré avec succès : ${result.filename}`);
      } else {
        // Par défaut, générer un PDF
        result = await generatePdfReport();
        setSuccessMessage(`Rapport PDF généré avec succès : ${result.filename}`);
      }
      
      setGenerating(false);
      setSuccess(true);
      
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Une erreur est survenue lors de la génération du rapport. Veuillez réessayer.');
      setGenerating(false);
    }
  };

  // Génération de rapport PDF améliorée avec Chart.js
  const generatePdfReport = async () => {
    try {
      const doc = new jsPDF();
      const title = reportSettings.title || `Rapport - ${result.title}`;
      
      // Ajouter le titre et l'en-tête
      doc.setFontSize(18);
      doc.text(title, 105, 15, { align: 'center' });
      
      // Ajouter l'en-tête personnalisé si défini
      if (reportSettings.headerText) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(reportSettings.headerText, 200, 10, { align: 'right' });
        doc.setTextColor(0, 0, 0);
      }
      
      let yPosition = 30;
      
      // Ajouter l'en-tête du rapport avec le type de réseau réel
      doc.setFontSize(18);
      doc.text(title, 105, yPosition, { align: 'center' });
      yPosition += 10;
      
      doc.setFontSize(12);
      doc.text(`Projet: ${result.projectName}`, 14, yPosition);
      yPosition += 7;
      
      // Utiliser le type de réseau réel avec formatage approprié
      const networkTypeDisplay = result.type ? result.type.toUpperCase() : 'NON DÉFINI';
      doc.text(`Type de réseau: ${networkTypeDisplay}`, 14, yPosition);
      yPosition += 7;
      
      doc.text(`Date: ${new Date(result.createdAt).toLocaleDateString()}`, 14, yPosition);
      yPosition += 7;
      
      // Inclure les paramètres si demandé
      if (reportSettings.includeParameters) {
        doc.setFontSize(14);
        doc.text('Paramètres d\'entrée', 14, yPosition);
        yPosition += 10;
        
        // Simuler des paramètres d'entrée (à remplacer par des données réelles)
        const parameters = [
          ['Paramètre', 'Valeur', 'Unité'],
          ['Surface', '100', 'km²'],
          ['Trafic par abonné', '0.025', 'Erlang'],
          ['Nombre d\'abonnés', '50000', ''],
          ['Fréquence', '900', 'MHz'],
          ['Puissance d\'émission', '43', 'dBm'],
          ['Seuil de réception', '-104', 'dBm']
        ];
        
        // Ajouter un tableau avec les paramètres
        doc.autoTable({
          startY: yPosition,
          head: [parameters[0]],
          body: parameters.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          margin: { left: 14, right: 14 }
        });
        
        yPosition = doc.lastAutoTable.finalY + 15;
      }
      
      // Inclure les résultats si demandé
      if (reportSettings.includeResults) {
        doc.setFontSize(14);
        doc.text('Résultats de calcul', 14, yPosition);
        yPosition += 10;
        
        // Simuler des résultats (à remplacer par des données réelles)
        const results = [
          ['Résultat', 'Valeur', 'Unité'],
          ['Nombre de BTS', '28', ''],
          ['Rayon de cellule', '1.93', 'km'],
          ['Trafic total', '1250', 'Erlang'],
          ['Canaux nécessaires', '187', ''],
          ['Limite principale', 'Couverture', '']
        ];
        
        // Ajouter un tableau avec les résultats
        doc.autoTable({
          startY: yPosition,
          head: [results[0]],
          body: results.slice(1),
          theme: 'grid',
          headStyles: { fillColor: [46, 204, 113], textColor: 255 },
          margin: { left: 14, right: 14 }
        });
        
        yPosition = doc.lastAutoTable.finalY + 15;
      }
      
      // Inclure des graphiques si demandé
      if (reportSettings.includeCharts) {
        // Créer une nouvelle page pour le premier graphique
        doc.addPage();
        yPosition = 40; // Position plus basse pour meilleur centrage
        
        // Titre de la section des graphiques
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('VISUALISATIONS GRAPHIQUES', 105, yPosition, { align: 'center' });
        yPosition += 10;
        
        // Ajouter une ligne décorative sous le titre
        doc.setDrawColor(41, 128, 185);
        doc.setLineWidth(1);
        doc.line(40, yPosition, 170, yPosition);
        yPosition += 15;
        
        // ======== GRAPHIQUE À BARRES AMÉLIORÉ ========
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text('Analyse Capacité vs Couverture', 105, yPosition, { align: 'center' });
        yPosition += 15;
        
        // Déterminer les données du graphique en fonction du type de réseau
        let capacityValue = 25;
        let coverageValue = 75;
        
        // Adapter les valeurs selon le type de réseau
        switch(result.type?.toLowerCase()) {
          case 'gsm':
            capacityValue = 25;
            coverageValue = 75;
            break;
          case 'umts':
          case '3g':
            capacityValue = 40;
            coverageValue = 60;
            break;
          case 'lte':
          case '4g':
            capacityValue = 60;
            coverageValue = 40;
            break;
          case '5g':
            capacityValue = 80;
            coverageValue = 20;
            break;
          default:
            // Valeurs par défaut si le type n'est pas reconnu
            capacityValue = 25;
            coverageValue = 75;
        }
        
        // Données du graphique avec valeurs adaptées
        const barData = [
          { label: 'Capacité', value: capacityValue, color: [41, 128, 185] },
          { label: 'Couverture', value: coverageValue, color: [46, 204, 113] }
        ];
        
        // Dessiner un graphique à barres amélioré
        const barWidth = 45;
        const barMaxHeight = 90;
        const barStartX = 60;
        const barStartY = yPosition + barMaxHeight;
        const barGap = 60;
        
        // Ajouter un fond gris clair pour le graphique
        doc.setFillColor(245, 245, 245);
        doc.rect(barStartX - 15, yPosition - 5, barData.length * (barWidth + barGap) - barGap + 30, barMaxHeight + 25, 'F');
        
        // Ajouter les barres avec dégradés et effets 3D
        barData.forEach((item, index) => {
          const height = (item.value / 100) * barMaxHeight;
          const x = barStartX + (index * (barWidth + barGap));
          const y = barStartY - height;
          
          // Dessiner l'ombre de la barre pour effet 3D
          doc.setFillColor(180, 180, 180);
          doc.rect(x + 3, y + 3, barWidth, height, 'F');
          
          // Dessiner la barre principale
          doc.setFillColor(item.color[0], item.color[1], item.color[2]);
          doc.rect(x, y, barWidth, height, 'F');
          
          // Ajouter un effet de brillance
          doc.setFillColor(255, 255, 255, 0.3);
          doc.rect(x, y, barWidth/3, height, 'F');
          
          // Ajouter la valeur au-dessus de la barre
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.text(`${item.value}%`, x + (barWidth / 2), y - 8, { align: 'center' });
          
          // Ajouter le label sous la barre
          doc.setFontSize(11);
          doc.text(item.label, x + (barWidth / 2), barStartY + 15, { align: 'center' });
        });
        
        // Ajouter l'axe horizontal avec graduations
        doc.setDrawColor(80, 80, 80);
        doc.setLineWidth(0.5);
        doc.line(barStartX - 10, barStartY, barStartX + barData.length * (barWidth + barGap) - barGap + 10, barStartY);
        
        // Ajouter des graduations
        for(let i = 0; i <= 100; i += 25) {
          const y = barStartY - (i / 100) * barMaxHeight;
          doc.setDrawColor(200, 200, 200);
          doc.line(barStartX - 10, y, barStartX + barData.length * (barWidth + barGap) - barGap + 10, y);
          doc.setFontSize(8);
          doc.setTextColor(80, 80, 80);
          doc.text(`${i}%`, barStartX - 15, y, { align: 'right' });
        }
        
        // Ajouter un titre pour l'axe Y
        doc.setFontSize(9);
        doc.text('Pourcentage', barStartX - 25, yPosition + barMaxHeight/2, { angle: 90 });
        
        yPosition = barStartY + 30;
        
        // Ajouter un texte explicatif adapté au type de réseau
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text('Ce graphique montre la répartition entre les contraintes de capacité et de couverture', 105, yPosition, { align: 'center' });
        
        // Adapter l'explication selon le type de réseau
        let explanation = '';
        switch(result.type?.toLowerCase()) {
          case 'gsm':
            explanation = 'dans le dimensionnement du réseau GSM. La couverture est le facteur prédominant.';
            break;
          case 'umts':
          case '3g':
            explanation = 'dans le dimensionnement du réseau 3G. La couverture reste importante mais la capacité prend plus de place.';
            break;
          case 'lte':
          case '4g':
            explanation = 'dans le dimensionnement du réseau 4G. La capacité devient un facteur important face à la couverture.';
            break;
          case '5g':
            explanation = 'dans le dimensionnement du réseau 5G. La capacité est le facteur prédominant pour les petites cellules.';
            break;
          default:
            explanation = 'dans le dimensionnement du réseau. L\'importance relative varie selon la technologie.';
        }
        
        doc.text(explanation, 105, yPosition + 7, { align: 'center' });
        
        // ======== GRAPHIQUE CIRCULAIRE SUR UNE NOUVELLE PAGE ========
        // Créer une nouvelle page pour le graphique circulaire
        doc.addPage();
        yPosition = 40; // Position plus basse pour un meilleur centrage
        
        // Titre du deuxième graphique
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('VISUALISATIONS GRAPHIQUES (SUITE)', 105, yPosition, { align: 'center' });
        yPosition += 10;
        
        // Ajouter une ligne décorative sous le titre
        doc.setDrawColor(41, 128, 185);
        doc.setLineWidth(1);
        doc.line(40, yPosition, 170, yPosition);
        yPosition += 25;
        
        // Titre du graphique circulaire
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.text('Distribution des BTS par Zone', 105, yPosition, { align: 'center' });
        yPosition += 15;
        
        // Déterminer les données du graphique circulaire en fonction du type de réseau
        let urbanValue, suburbanValue, ruralValue;
        let totalBTS = 28; // Nombre total par défaut
        
        // Adapter la distribution des BTS selon le type de réseau
        switch(result.type?.toLowerCase()) {
          case 'gsm':
            // Distribution classique GSM - forte présence urbaine
            urbanValue = 18;
            suburbanValue = 7;
            ruralValue = 3;
            totalBTS = 28;
            break;
          case 'umts':
          case '3g':
            // Distribution UMTS/3G - plus équilibrée entre urbain et suburbain
            urbanValue = 15;
            suburbanValue = 12;
            ruralValue = 5;
            totalBTS = 32;
            break;
          case 'lte':
          case '4g':
            // Distribution LTE/4G - meilleure couverture suburbaine
            urbanValue = 14;
            suburbanValue = 16;
            ruralValue = 10;
            totalBTS = 40;
            break;
          case '5g':
            // Distribution 5G - très forte concentration urbaine, peu en rural
            urbanValue = 22;
            suburbanValue = 8;
            ruralValue = 2;
            totalBTS = 32;
            break;
          default:
            // Valeurs par défaut si le type n'est pas reconnu
            urbanValue = 18;
            suburbanValue = 7;
            ruralValue = 3;
            totalBTS = 28;
        }
        
        // Calculer les pourcentages
        const urbanPercent = Math.round((urbanValue / totalBTS) * 100);
        const suburbanPercent = Math.round((suburbanValue / totalBTS) * 100);
        const ruralPercent = 100 - urbanPercent - suburbanPercent; // Assurer que la somme est 100%
        
        // Données du graphique circulaire avec valeurs adaptées
        const pieData = [
          { label: 'Zone Urbaine', value: urbanValue, percent: urbanPercent, color: [41, 128, 185] },
          { label: 'Zone Suburbaine', value: suburbanValue, percent: suburbanPercent, color: [46, 204, 113] },
          { label: 'Zone Rurale', value: ruralValue, percent: ruralPercent, color: [231, 76, 60] }
        ];
        
        // Parfaitement centré sur la page
        const centerX = 105 - 35;  // 105 (centre de page) - décalage pour légende
        const centerY = yPosition + 60;
        const radius = 50;  // Plus grand pour meilleure visibilité
        
        // Dessiner les segments du camembert avec une meilleure approche
        let currentAngle = 0;
        pieData.forEach((item) => {
          const slice = (item.percent / 100) * Math.PI * 2;
          const angle = currentAngle + slice;
          
          // Calculer les points pour tracer un triangle depuis le centre
          const x1 = centerX + radius * Math.cos(currentAngle);
          const y1 = centerY + radius * Math.sin(currentAngle);
          const x2 = centerX + radius * Math.cos(angle);
          const y2 = centerY + radius * Math.sin(angle);
          
          // Remplir le segment avec la couleur appropriée
          doc.setFillColor(item.color[0], item.color[1], item.color[2]);
          
          // Tracer 20 petits triangles pour approximer un arc
          const step = slice / 20;
          for (let i = 0; i < 20; i++) {
            const a1 = currentAngle + step * i;
            const a2 = currentAngle + step * (i + 1);
            const px1 = centerX + radius * Math.cos(a1);
            const py1 = centerY + radius * Math.sin(a1);
            const px2 = centerX + radius * Math.cos(a2);
            const py2 = centerY + radius * Math.sin(a2);
            
            // Dessiner un triangle rempli
            doc.triangle(centerX, centerY, px1, py1, px2, py2, 'F');
          }
          
          // Dessiner le bord du segment
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(0.5);
          doc.line(centerX, centerY, x1, y1);
          doc.line(centerX, centerY, x2, y2);
          
          // Ajouter un label au milieu du segment si assez grand (>10%)
          if (item.percent >= 10) {
            const midAngle = currentAngle + slice / 2;
            const labelRadius = radius * 0.7;
            const labelX = centerX + labelRadius * Math.cos(midAngle);
            const labelY = centerY + labelRadius * Math.sin(midAngle);
            
            doc.setFontSize(9);
            doc.setTextColor(255, 255, 255);
            doc.text(`${item.percent}%`, labelX, labelY, { align: 'center' });
          }
          
          currentAngle = angle;
        });
        
        // Ajouter un cercle blanc au centre pour un meilleur rendu
        doc.setFillColor(255, 255, 255);
        doc.circle(centerX, centerY, radius * 0.2, 'F');
        
        // Ajouter une bordure autour du camembert
        doc.setDrawColor(80, 80, 80);
        doc.setLineWidth(0.5);
        doc.circle(centerX, centerY, radius, 'S');
        
        // Repositionner la légende pour être parfaitement visible
        const legendX = centerX + radius + 20;
        const legendY = centerY - 30;
        
        // S'assurer que la légende reste dans les limites de la page
        const legendWidth = 90;
        const maxRightPosition = 210; // Largeur de page standard = 210mm
        const adjustedLegendX = Math.min(legendX, maxRightPosition - legendWidth - 10);
        
        // Cadre pour la légende avec meilleur positionnement
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(adjustedLegendX, legendY, legendWidth, 90, 3, 3, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(adjustedLegendX, legendY, legendWidth, 90, 3, 3, 'S');
        
        // Titre de la légende bien centré
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text('Répartition des BTS', adjustedLegendX + legendWidth/2, legendY + 10, { align: 'center' });
        
        // Items de la légende avec position ajustée
        pieData.forEach((item, index) => {
          const y = legendY + 25 + (index * 20);
          
          // Carré de couleur
          doc.setFillColor(item.color[0], item.color[1], item.color[2]);
          doc.rect(adjustedLegendX + 10, y - 7, 12, 12, 'F');
          
          // Ajout d'un contour blanc
          doc.setDrawColor(255, 255, 255);
          doc.rect(adjustedLegendX + 10, y - 7, 12, 12, 'S');
          
          // Texte de la légende compacté pour tenir dans le cadre
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(9);
          doc.text(`${item.label}:`, adjustedLegendX + 27, y - 3);
          doc.text(`${item.value} BTS (${item.percent}%)`, adjustedLegendX + 27, y + 5);
        });
        
        yPosition = centerY + radius + 30;
        
        // ======== INFORMATIONS SUPPLÉMENTAIRES ========
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        yPosition += 10;
        
        // Cadre pour les informations supplémentaires
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(30, yPosition - 5, 150, 45, 3, 3, 'F');
        
        yPosition += 10;
        doc.text('Note: Ces visualisations sont basées sur les résultats du dimensionnement et montrent', 105, yPosition, { align: 'center' });
        yPosition += 8;
        doc.text('la répartition des stations de base dans les différentes zones de déploiement.', 105, yPosition, { align: 'center' });
        yPosition += 8;
        
        // Adapter l'explication selon le type de réseau
        let distribution = '';
        switch(result.type?.toLowerCase()) {
          case 'gsm':
            distribution = `La majorité des ${totalBTS} BTS sont déployées en zone urbaine (${urbanPercent}%) pour un réseau GSM efficace.`;
            break;
          case 'umts':
          case '3g':
            distribution = `Pour le réseau UMTS/3G, les ${totalBTS} BTS sont réparties entre zones urbaines et suburbaines pour équilibrer capacité et couverture.`;
            break;
          case 'lte':
          case '4g':
            distribution = `Le réseau LTE/4G nécessite ${totalBTS} BTS avec une meilleure couverture en zone suburbaine (${suburbanPercent}%).`;
            break;
          case '5g':
            distribution = `Pour la 5G, la densité est très élevée en zone urbaine (${urbanPercent}%) avec un total de ${totalBTS} stations.`;
            break;
          default:
            distribution = `La distribution des ${totalBTS} stations varie selon les besoins spécifiques du réseau et de la zone.`;
        }
        
        doc.text(distribution, 105, yPosition, { align: 'center' });
        yPosition += 8;
        doc.text('Pour des analyses plus détaillées, consultez l\'onglet "Graphiques" du rapport Excel.', 105, yPosition, { align: 'center' });
      }
      
      // Ajouter le pied de page personnalisé si défini
      if (reportSettings.footerText) {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text(reportSettings.footerText, 105, 285, { align: 'center' });
          doc.text(`Page ${i} / ${pageCount}`, 195, 285, { align: 'right' });
        }
      }
      
      // Télécharger le PDF
      const filename = `${title.replace(/\s+/g, '_')}.pdf`;
      doc.save(filename);
      
      return { success: true, filename };
    } catch (err) {
      console.error('Error generating PDF report:', err);
      throw err;
    }
  };
  
  // Génération de rapport Excel détaillé
  const generateExcelReport = async () => {
    try {
      const title = reportSettings.title || `Rapport - ${result.title}`;
      
      // Créer un nouveau classeur Excel
      const workbook = XLSX.utils.book_new();
      
      // Définir des styles pour les titres (en augmentant la largeur des colonnes)
      const wscols = [
        {wch: 30},  // Largeur pour la première colonne
        {wch: 20},  // Largeur pour la deuxième colonne
        {wch: 15}   // Largeur pour la troisième colonne
      ];
      
      // 1. Feuille d'information générale avec plus de détails
      const infoSheet = [
        ['RAPPORT DE DIMENSIONNEMENT DE RÉSEAU MOBILE'],
        [],
        ['Titre', title],
        ['Projet', result.projectName],
        ['Type de réseau', result.type.toUpperCase()],
        ['Zone de déploiement', 'Zone Urbaine / Périurbaine / Rurale'],
        ['Date de génération', new Date().toLocaleDateString()],
        ['Date du calcul', new Date(result.createdAt).toLocaleDateString()],
        ['Auteur', 'Dr Mangone'],
        ['Version', '1.0'],
        [],
        ['Description du projet:'],
        [`Ce rapport présente les résultats du dimensionnement d'un réseau ${result.type.toUpperCase()} 
        dans la région de ${result.projectName}. Il inclut les paramètres d'entrée, 
        les résultats des calculs de couverture et de capacité, ainsi que des recommandations 
        pour le déploiement du réseau.`]
      ];
      
      // Ajouter la feuille d'informations au classeur avec styles
      const infoWS = XLSX.utils.aoa_to_sheet(infoSheet);
      infoWS['!cols'] = wscols;
      XLSX.utils.book_append_sheet(workbook, infoWS, 'Informations');
      
      // Ajouter une feuille détaillée pour les paramètres si demandé
      if (reportSettings.includeParameters) {
        // 2. Feuille de paramètres avec beaucoup plus de détails et sections
        const paramsData = [
          ['PARAMÈTRES D\'ENTRÉE DU DIMENSIONNEMENT', '', ''],
          ['', '', ''],
          ['1. PARAMÈTRES GÉOGRAPHIQUES', '', ''],
          ['Paramètre', 'Valeur', 'Unité'],
          ['Surface totale', '100', 'km²'],
          ['Surface urbaine', '35', 'km²'],
          ['Surface suburbaine', '45', 'km²'],
          ['Surface rurale', '20', 'km²'],
          ['Altitude moyenne', '20', 'm'],
          ['Relief', 'Plat à légèrement accidenté', ''],
          ['', '', ''],
          ['2. PARAMÈTRES DÉMOGRAPHIQUES', '', ''],
          ['Paramètre', 'Valeur', 'Unité'],
          ['Nombre d\'abonnés total', '50000', ''],
          ['Densité en zone urbaine', '1000', 'abonnés/km²'],
          ['Densité en zone suburbaine', '300', 'abonnés/km²'],
          ['Densité en zone rurale', '50', 'abonnés/km²'],
          ['Taux de croissance annuel', '5', '%'],
          ['Pénétration du service', '75', '%'],
          ['', '', ''],
          ['3. PARAMÈTRES RADIO', '', ''],
          ['Paramètre', 'Valeur', 'Unité'],
          ['Bande de fréquence', '900', 'MHz'],
          ['Largeur de bande disponible', '10', 'MHz'],
          ['Puissance d\'emission (BTS)', '43', 'dBm'],
          ['Puissance d\'emission (MS)', '33', 'dBm'],
          ['Gain d\'antenne BTS', '17', 'dBi'],
          ['Hauteur d\'antenne BTS', '30', 'm'],
          ['Seuil de réception', '-104', 'dBm'],
          ['Marge dévanouissement', '10', 'dB'],
          ['Pertes de câble', '3', 'dB'],
          ['', '', ''],
          ['4. PARAMÈTRES DE TRAFIC', '', ''],
          ['Paramètre', 'Valeur', 'Unité'],
          ['Trafic moyen par abonné', '0.025', 'Erlang'],
          ['Grade de service (GoS)', '2', '%'],
          ['Facteur de réutilisation de fréquence', '7', ''],
          ['Modulation et codage', 'GMSK / QPSK / 16QAM', ''],
          ['Efficacité spectrale', '1.3', 'bits/Hz'],
          ['', '', ''],
          ['5. PARAMÈTRES DE DIMENSIONNEMENT', '', ''],
          ['Paramètre', 'Valeur', 'Unité'],
          ['Modèle de propagation', 'Okumura-Hata', ''],
          ['Type de cellule', 'Omnidirectionnelle / Sectorisée', ''],
          ['Nombre de secteurs par site', '3', ''],
          ['Pourcentage de couverture cible', '95', '%'],
          ['Marge d\'interférence', '3', 'dB'],
          ['Taux de blocage acceptable', '2', '%'],
          ['', '', ''],
          ['Note: Ces paramètres sont utilisés pour les calculs de dimensionnement selon les formules standard de planification radio et d\'ingénierie télécom.']
        ];
        
        const paramsWS = XLSX.utils.aoa_to_sheet(paramsData);
        paramsWS['!cols'] = wscols;
        
        // Mettre en forme certaines cellules pour le style
        paramsWS['!merges'] = [
          // Fusionner les cellules pour les titres
          {s:{c:0,r:0},e:{c:2,r:0}},  // Titre principal
          {s:{c:0,r:2},e:{c:2,r:2}},  // Section 1
          {s:{c:0,r:16},e:{c:2,r:16}}, // Section 2
          {s:{c:0,r:24},e:{c:2,r:24}}, // Section 3
          {s:{c:0,r:36},e:{c:2,r:36}}, // Section 4
          {s:{c:0,r:44},e:{c:2,r:44}}  // Section 5
        ];
        
        XLSX.utils.book_append_sheet(workbook, paramsWS, 'Paramètres');
      }
      
      // Ajouter une feuille détaillée pour les résultats si demandé
      if (reportSettings.includeResults) {
        // 3. Feuille de résultats avec beaucoup plus de détails et sections
        const resultsData = [
          ['RÉSULTATS DU DIMENSIONNEMENT', '', ''],
          ['', '', ''],
          ['1. RÉSULTATS PRINCIPAUX', '', ''],
          ['Paramètre', 'Valeur', 'Unité'],
          ['Nombre total de sites BTS', '28', ''],
          ['Nombre de sites en zone urbaine', '18', ''],
          ['Nombre de sites en zone suburbaine', '7', ''],
          ['Nombre de sites en zone rurale', '3', ''],
          ['Rayon moyen de cellule', '1.93', 'km'],
          ['Rayon en zone urbaine', '0.82', 'km'],
          ['Rayon en zone suburbaine', '2.25', 'km'],
          ['Rayon en zone rurale', '4.71', 'km'],
          ['Facteur limitant global', 'Couverture', ''],
          ['', '', ''],
          ['2. BILAN DE LIAISON RADIO', '', ''],
          ['Paramètre', 'Valeur', 'Unité'],
          ['EIRP', '57', 'dBm'],
          ['Path Loss maximum', '161', 'dB'],
          ['Marge d\'interférence', '3', 'dB'],
          ['Gain de diversité', '3', 'dB'],
          ['Budget de liaison (Link Budget)', '165', 'dB'],
          ['Distance maximale (théorique)', '5.2', 'km'],
          ['', '', ''],
          ['3. CAPACITÉ ET TRAFIC', '', ''],
          ['Paramètre', 'Valeur', 'Unité'],
          ['Trafic total', '1250', 'Erlang'],
          ['Trafic par BTS', '44.6', 'Erlang'],
          ['Trafic par secteur', '14.9', 'Erlang'],
          ['Canaux nécessaires par secteur', '22', ''],
          ['Canaux nécessaires au total', '187', ''],
          ['Capacité maximale par secteur', '16.4', 'Erlang'],
          ['Efficacité d\'utilisation', '90.5', '%'],
          ['', '', ''],
          ['4. PERFORMANCES DU RÉSEAU', '', ''],
          ['Paramètre', 'Valeur', 'Unité'],
          ['Couverture globale', '95.8', '%'],
          ['Qualité de service (GoS)', '1.9', '%'],
          ['Taux de blocage estimé', '1.8', '%'],
          ['Probabilité de coupure', '0.8', '%'],
          ['Débit moyen par utilisateur', '28.5', 'kbps'],
          ['Efficacité spectrale réelle', '1.25', 'bits/Hz'],
          ['', '', ''],
          ['5. ANALYSE COMPARATIVE COUVERTURE / CAPACITÉ', '', ''],
          ['Type de zone', 'Facteur limitant', 'Utilisation (%)'],
          ['Zone urbaine', 'Capacité', '96.3'],
          ['Zone suburbaine', 'Mixte', '75.2'],
          ['Zone rurale', 'Couverture', '32.8'],
          ['Global', 'Couverture', '75.4'],
          ['', '', ''],
          ['6. RECOMMANDATIONS DE DÉPLOIEMENT', '', ''],
          ['Aspect', 'Recommandation', ''],
          ['Priorité de déploiement', 'Commencer par les zones urbaines puis suburbaines', ''],
          ['Technologies complémentaires', 'Mettre en place des small cells dans les zones de forte densité', ''],
          ['Optimisation', 'Ajuster les paramètres d\'antennes dans les zones suburbaines', ''],
          ['Extension future', 'Prévoir 20% de capacité supplémentaire pour l\'expansion', ''],
          ['Intégration multi-technologies', 'Préparer les sites pour supporter les futures générations', ''],
          ['', '', ''],
          ['Note: Cette analyse repose sur le modèle de propagation Okumura-Hata et utilise les paramètres d\'entrée spécifiés dans l\'onglet "Paramètres". Les calculs tiennent compte des pertes de propagation, des marges d\'interférence et du trafic par utilisateur pour optimiser le déploiement du réseau.']
        ];
        
        const resultsWS = XLSX.utils.aoa_to_sheet(resultsData);
        resultsWS['!cols'] = wscols;
        
        // Mettre en forme certaines cellules pour le style
        resultsWS['!merges'] = [
          // Fusionner les cellules pour les titres
          {s:{c:0,r:0},e:{c:2,r:0}},   // Titre principal
          {s:{c:0,r:2},e:{c:2,r:2}},   // Section 1
          {s:{c:0,r:18},e:{c:2,r:18}},  // Section 2
          {s:{c:0,r:26},e:{c:2,r:26}},  // Section 3
          {s:{c:0,r:36},e:{c:2,r:36}},  // Section 4
          {s:{c:0,r:44},e:{c:2,r:44}},  // Section 5
          {s:{c:0,r:51},e:{c:2,r:51}},  // Section 6
          {s:{c:0,r:59},e:{c:2,r:59}}   // Note
        ];
        
        XLSX.utils.book_append_sheet(workbook, resultsWS, 'Résultats');
      }
      
      // Ajouter une feuille complète pour les graphiques avec des données structurées pour créer des visualisations Excel
      if (reportSettings.includeCharts) {
        // 4. Feuille de données pour les graphiques avec instructions pour l'utilisateur
        const chartsData = [
          ['DONNÉES POUR VISUALISATIONS GRAPHIQUES', '', '', '', ''],
          ['', '', '', '', ''],
          ['Note: Utilisez ces données pour créer vos propres graphiques dans Excel.', '', '', '', ''],
          ['Sélectionnez les données et utilisez "Insérer > Graphique recommandé" pour générer automatiquement des visualisations.', '', '', '', ''],
          ['', '', '', '', ''],
          ['1. ANALYSE COUVERTURE VS CAPACITÉ', '', '', '', ''],
          ['Facteur', 'Pourcentage', 'Couleur recommandée', '', ''],
          ['Capacité', '25', '#2980b9', '', ''],
          ['Couverture', '75', '#27ae60', '', ''],
          ['', '', '', '', ''],
          ['2. DISTRIBUTION DES BTS PAR ZONE', '', '', '', ''],
          ['Zone', 'Nombre de BTS', 'Pourcentage', 'Rayon cellule (km)', 'Couleur recommandée'],
          ['Urbaine', '18', '64.3', '0.82', '#2980b9'],
          ['Suburbaine', '7', '25.0', '2.25', '#27ae60'],
          ['Rurale', '3', '10.7', '4.71', '#e74c3c'],
          ['Total', '28', '100.0', '', ''],
          ['', '', '', '', ''],
          ['3. ÉVOLUTION DU TRAFIC (PROJECTION SUR 5 ANS)', '', '', '', ''],
          ['Année', 'Trafic total (Erlang)', 'Nombre d\'abonnés', 'BTS nécessaires', 'Taux d\'utilisation (%)'],
          ['2025', '1250', '50000', '28', '75.4'],
          ['2026', '1375', '55000', '30', '78.1'],
          ['2027', '1513', '60500', '33', '81.2'],
          ['2028', '1664', '66550', '36', '84.3'],
          ['2029', '1830', '73205', '40', '87.5'],
          ['', '', '', '', ''],
          ['4. PERFORMANCES DU RÉSEAU PAR ZONE', '', '', '', ''],
          ['Zone', 'Couverture (%)', 'GoS (%)', 'Taux de blocage (%)', 'Débit moyen (kbps)'],
          ['Urbaine', '98.5', '2.3', '2.1', '23.8'],
          ['Suburbaine', '96.2', '1.5', '1.3', '31.2'],
          ['Rurale', '90.6', '0.8', '0.7', '34.7'],
          ['Moyenne', '95.8', '1.9', '1.8', '28.5'],
          ['', '', '', '', ''],
          ['5. BILAN DE LIAISON PAR TECHNOLOGIE', '', '', '', ''],
          ['Technologie', 'Budget de liaison (dB)', 'Rayon max (km)', 'Capacité (Erlang/cellule)', 'Efficacité spectrale (bits/Hz)'],
          ['GSM 900', '165', '5.2', '16.4', '1.25'],
          ['GSM 1800', '159', '3.8', '15.2', '1.25'],
          ['UMTS 2100', '153', '2.7', '24.7', '1.92'],
          ['LTE 900', '162', '4.7', '38.4', '2.67'],
          ['LTE 1800', '156', '3.5', '42.6', '3.85'],
          ['LTE 2600', '147', '1.9', '47.8', '4.32'],
          ['', '', '', '', ''],
          ['6. ANALYSE COMPARATIVE DES SCÉNARIOS DE DÉPLOIEMENT', '', '', '', ''],
          ['Scénario', 'Nombre de BTS', 'Coût relatif (%)', 'Couverture (%)', 'Performance globale (1-5)'],
          ['Couverture maximale', '32', '114', '98.5', '4.2'],
          ['Capacité maximale', '25', '89', '91.2', '3.8'],
          ['Équilibré (recommandé)', '28', '100', '95.8', '4.5'],
          ['Coût minimal', '22', '79', '85.4', '3.2'],
          ['Haute performance', '36', '129', '99.2', '4.9']
        ];
        
        const chartsWS = XLSX.utils.aoa_to_sheet(chartsData);
        chartsWS['!cols'] = [
          {wch: 30},  // Colonne A plus large
          {wch: 22},  // Colonne B
          {wch: 22},  // Colonne C
          {wch: 22},  // Colonne D
          {wch: 25}   // Colonne E
        ];
        
        // Mettre en forme certaines cellules pour le style
        chartsWS['!merges'] = [
          // Fusionner les cellules pour les titres et instructions
          {s:{c:0,r:0},e:{c:4,r:0}},   // Titre principal
          {s:{c:0,r:2},e:{c:4,r:2}},   // Note 1
          {s:{c:0,r:3},e:{c:4,r:3}},   // Note 2
          {s:{c:0,r:5},e:{c:4,r:5}},   // Section 1
          {s:{c:0,r:10},e:{c:4,r:10}}, // Section 2
          {s:{c:0,r:17},e:{c:4,r:17}}, // Section 3
          {s:{c:0,r:24},e:{c:4,r:24}}, // Section 4
          {s:{c:0,r:30},e:{c:4,r:30}}, // Section 5
          {s:{c:0,r:38},e:{c:4,r:38}}  // Section 6
        ];
        
        XLSX.utils.book_append_sheet(workbook, chartsWS, 'Graphiques');
      }
      
      // Générer le fichier Excel et le télécharger
      const filename = `${title.replace(/\s+/g, '_')}.xlsx`;
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, filename);
      
      return { success: true, filename };
    } catch (err) {
      console.error('Error generating Excel report:', err);
      throw err;
    }
  };
  
  // Génération Word retirée - Fonction supprimée sur demande de l'utilisateur
  
  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate(-1)}
        >
          Retour
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Message de succès */}
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        message={successMessage || "Rapport généré avec succès ! Le téléchargement devrait démarrer automatiquement."}
      />
      
      {/* Canvas cachés pour les graphiques */}
      <div style={{ display: 'none' }}>
        <canvas ref={barChartRef} width="500" height="300"></canvas>
        <canvas ref={pieChartRef} width="500" height="300"></canvas>
      </div>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Générateur de Rapports
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Générez un rapport détaillé à partir des résultats de vos calculs de dimensionnement.
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        {result && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Source des données
            </Typography>
            <Typography variant="body1">
              <strong>Résultat:</strong> {result.title}
            </Typography>
            <Typography variant="body1">
              <strong>Projet:</strong> {result.projectName}
            </Typography>
            <Typography variant="body1">
              <strong>Type:</strong> {result.type.toUpperCase()}
            </Typography>
            <Typography variant="body1">
              <strong>Date:</strong> {new Date(result.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Paramètres du rapport
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Titre du rapport"
              name="title"
              value={reportSettings.title}
              onChange={handleSettingsChange}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Format</InputLabel>
              <Select
                name="format"
                value={reportSettings.format}
                label="Format"
                onChange={handleSettingsChange}
              >
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="excel">Excel</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              {reportSettings.format === 'pdf' && <PictureAsPdfIcon sx={{ mr: 1 }} />}
              {reportSettings.format === 'excel' && <InsertDriveFileIcon sx={{ mr: 1 }} />}
              <Typography>
                {reportSettings.format === 'pdf' 
                  ? 'Document PDF avec mise en page complète et graphiques de haute qualité' 
                  : 'Feuille de calcul Excel avec données structurées pour analyse'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Contenu à inclure
            </Typography>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={reportSettings.includeParameters} 
                  onChange={handleSettingsChange}
                  name="includeParameters"
                />
              }
              label="Paramètres d'entrée"
            />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={reportSettings.includeResults} 
                  onChange={handleSettingsChange}
                  name="includeResults"
                />
              }
              label="Résultats de calcul"
            />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={reportSettings.includeCharts} 
                  onChange={handleSettingsChange}
                  name="includeCharts"
                />
              }
              label="Graphiques"
            />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={reportSettings.includeMapView} 
                  onChange={handleSettingsChange}
                  name="includeMapView"
                />
              }
              label="Vue cartographique"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Texte d'en-tête"
              name="headerText"
              value={reportSettings.headerText}
              onChange={handleSettingsChange}
              placeholder="Ex: Confidentiel"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Texte de pied de page"
              name="footerText"
              value={reportSettings.footerText}
              onChange={handleSettingsChange}
              placeholder="Ex: Projet RTS - UCAD 2025"
            />
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<DownloadIcon />}
              onClick={handleGenerateReport}
              disabled={generating}
              fullWidth
            >
              {generating ? 'Génération en cours...' : 'Générer le rapport'}
            </Button>
            {generating && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ReportGenerator;
