import React, { useState, useEffect } from 'react';
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

const ReportGenerator = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
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

  // Mock data for demonstration
  const mockResult = {
    id: resultId || '123',
    type: 'gsm',
    title: 'Dimensionnement GSM - Zone Urbaine',
    createdAt: new Date().toISOString(),
    projectId: 'project-123',
    projectName: 'Déploiement Réseau Dakar',
  };

  // In a real implementation, this would fetch the actual result
  useEffect(() => {
    const fetchResult = async () => {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // In a real implementation:
        // const response = await api.getResultById(resultId);
        // setResult(response.data);
        
        setResult(mockResult);
        setReportSettings(prev => ({
          ...prev,
          title: `Rapport - ${mockResult.title}`
        }));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching result:', err);
        setError('Impossible de charger les résultats pour générer le rapport');
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultId]);

  const handleSettingsChange = (event) => {
    const { name, value, checked } = event.target;
    setReportSettings(prev => ({
      ...prev,
      [name]: event.target.type === 'checkbox' ? checked : value
    }));
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Créer un nouveau document PDF
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
      
      // Ajouter des informations sur le projet
      doc.setFontSize(12);
      doc.text(`Projet: ${result.projectName}`, 14, 30);
      doc.text(`Type: ${result.type.toUpperCase()}`, 14, 38);
      doc.text(`Date: ${new Date(result.createdAt).toLocaleDateString()}`, 14, 46);
      
      let yPosition = 60;
      
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
        doc.setFontSize(14);
        doc.text('Visualisations graphiques', 14, yPosition);
        yPosition += 10;
        
        // Création d'un graphique simple (diagramme en barres)
        // Simuler des données pour un graphique
        const chartData = [
          { label: 'Capacité', value: 25 },
          { label: 'Couverture', value: 75 }
        ];
        
        // Dessiner un graphique en barres simple directement dans le PDF
        const chartWidth = 160;
        const chartHeight = 80;
        const barWidth = chartWidth / chartData.length / 2;
        const maxValue = Math.max(...chartData.map(item => item.value));
        
        // Dessiner l'axe X
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(30, yPosition + chartHeight, 30 + chartWidth, yPosition + chartHeight);
        
        // Dessiner l'axe Y
        doc.line(30, yPosition, 30, yPosition + chartHeight);
        
        // Dessiner les barres
        chartData.forEach((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          const barX = 40 + (index * (barWidth * 2 + 15));
          const barY = yPosition + chartHeight - barHeight;
          
          // Couleur par catégorie
          if (index === 0) {
            doc.setFillColor(41, 128, 185); // Bleu
          } else {
            doc.setFillColor(46, 204, 113); // Vert
          }
          
          // Dessiner la barre
          doc.rect(barX, barY, barWidth, barHeight, 'F');
          
          // Ajouter le label sous la barre
          doc.setFontSize(8);
          doc.text(item.label, barX + (barWidth/2), yPosition + chartHeight + 10, { align: 'center' });
          
          // Ajouter la valeur au-dessus de la barre
          doc.setFontSize(8);
          doc.text(item.value.toString(), barX + (barWidth/2), barY - 5, { align: 'center' });
        });
        
        // Graphique en secteurs (cercle simple divisé)
        const pieData = [
          { label: 'Zone Urbaine', value: 18, color: [41, 128, 185] },
          { label: 'Zone Suburbaine', value: 7, color: [46, 204, 113] },
          { label: 'Zone Rurale', value: 3, color: [231, 76, 60] }
        ];
        
        const pieX = 140;
        const pieY = yPosition + 40;
        const pieRadius = 30;
        const total = pieData.reduce((sum, item) => sum + item.value, 0);
        
        let startAngle = 0;
        
        // Légende du graphique en secteurs
        doc.setFontSize(10);
        doc.text('Distribution des BTS', pieX, yPosition - 5, { align: 'center' });
        
        // Dessiner le graphique en secteurs
        pieData.forEach((slice, index) => {
          const sliceAngle = (slice.value / total) * 360;
          const endAngle = startAngle + sliceAngle;
          
          // Convertir les angles en radians
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          
          // Tracer le secteur
          doc.setFillColor(slice.color[0], slice.color[1], slice.color[2]);
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(1);
          
          // Chemin pour dessiner un secteur
          doc.ellipse(pieX, pieY, pieRadius, pieRadius, 'F');
          doc.triangle(
            pieX, 
            pieY, 
            pieX + pieRadius * Math.cos(startRad), 
            pieY + pieRadius * Math.sin(startRad),
            pieX + pieRadius * Math.cos(endRad), 
            pieY + pieRadius * Math.sin(endRad),
            'F'
          );
          
          // Légende de l'item
          doc.setFillColor(slice.color[0], slice.color[1], slice.color[2]);
          doc.rect(pieX + 50, yPosition + (index * 12), 8, 8, 'F');
          doc.setFontSize(8);
          doc.setTextColor(0);
          doc.text(`${slice.label} (${slice.value})`, pieX + 65, yPosition + 5 + (index * 12));
          
          startAngle = endAngle;
        });
        
        yPosition += chartHeight + 30;
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
      
      // Générer le nom de fichier selon le format choisi
      let filename = '';
      let formatMessage = '';
      
      switch (reportSettings.format) {
        case 'pdf':
          filename = `${title.replace(/\s+/g, '_')}.pdf`;
          break;
          
        case 'excel':
          // Dans l'implémentation actuelle, nous générons quand même un PDF
          filename = `${title.replace(/\s+/g, '_')}.pdf`;
          formatMessage = "Format Excel en cours de développement - Un PDF a été généré en attendant. Cette fonctionnalité sera disponible dans une version future.";
          break;
          
        case 'word':
          // Dans l'implémentation actuelle, nous générons quand même un PDF
          filename = `${title.replace(/\s+/g, '_')}.pdf`;
          formatMessage = "Format Word en cours de développement - Un PDF a été généré en attendant. Cette fonctionnalité sera disponible dans une version future.";
          break;
          
        default:
          filename = `${title.replace(/\s+/g, '_')}.pdf`;
      }
      
      // Télécharger le PDF
      doc.save(filename);
      
      // Si un message concernant le format est défini, le mémoriser pour l'afficher
      if (formatMessage) {
        setError(formatMessage);
      }
      
      setGenerating(false);
      setSuccess(true);
      
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Une erreur est survenue lors de la génération du rapport. Veuillez réessayer.');
      setGenerating(false);
    }
  };

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
        message="Rapport généré avec succès ! Le téléchargement devrait démarrer automatiquement."
      />
      
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
                <MenuItem value="word">Word</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              {reportSettings.format === 'pdf' && <PictureAsPdfIcon sx={{ mr: 1 }} />}
              {reportSettings.format === 'excel' && <InsertDriveFileIcon sx={{ mr: 1 }} />}
              {reportSettings.format === 'word' && <InsertDriveFileIcon sx={{ mr: 1 }} />}
              <Typography>
                {reportSettings.format === 'pdf' ? 'Document PDF avec mise en page complète' : 
                 reportSettings.format === 'excel' ? 'Feuille de calcul avec tableaux détaillés' :
                 'Document Word modifiable'}
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
