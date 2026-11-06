import React, { useState, useEffect, useMemo } from 'react';

// ==========================================
// 1. BASE DE DONNÉES MÉDICAMENTEUSE TUNISIENNE (Sécurisée & Validée)
// ==========================================
// Liste de démonstration, fiable pour les tests. À enrichir par le médecin.
const DRUG_DATABASE = [
  {
    id: "amox-01",
    dci: "Amoxicilline",
    brandName: "Clamoxyl / Amoxil / Ospamox",
    lab: "Saiph / Hikma / Opalia",
    form: "Sirop / Suspension buvable",
    concentrations: [
      { label: "125 mg / 5 ml", mgPerMl: 25 },
      { label: "250 mg / 5 ml", mgPerMl: 50 },
      { label: "500 mg / 5 ml", mgPerMl: 100 }
    ],
    pediatricDose: { standard: 50, max: 100, unit: "mg/kg/jour", dosesPerDay: 3 },
    contraindications: ["Allergie aux pénicillines", "Hypersensibilité B-lactamines"],
    g6pdSafe: true,
    renalAdjustment: true,
    category: "Antibiotique"
  },
  {
    id: "para-01",
    dci: "Paracétamol",
    brandName: "Doliprane / Perfalgan / Efferalgan",
    lab: "Unimed / Saiph / Sanofi",
    form: "Sirop (2.4%) / Suppositoire",
    concentrations: [
      { label: "Sirop 2.4% (1 diplôme = 1 kg)", mgPerMl: 24 },
      { label: "Suppositoire 100 mg", fixedDose: 100 },
      { label: "Suppositoire 200 mg", fixedDose: 200 }
    ],
    pediatricDose: { standard: 60, max: 80, unit: "mg/kg/jour", dosesPerDay: 4 },
    contraindications: ["Insuffisance hépatocellulaire sévère"],
    g6pdSafe: true,
    category: "Antipyrétique / Antalgique"
  },
  {
    id: "ibu-01",
    dci: "Ibuprofène",
    brandName: "Advil / Algofen",
    lab: "Pfizer / Saiph",
    form: "Sirop 20 mg/ml",
    concentrations: [
      { label: "Sirop 20 mg/ml (1 diplôme = 10 mg/kg)", mgPerMl: 20 }
    ],
    pediatricDose: { standard: 30, max: 30, unit: "mg/kg/jour", dosesPerDay: 3 },
    contraindications: ["Âge < 3 mois", "Varicelle", "Insuffisance rénale sévère"],
    g6pdSafe: true,
    category: "AINS"
  }
];

// Styles Inline pour plus de simplicité dans ce fichier unique
const styles = {
  app: { fontFamily: 'sans-serif', padding: '20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f0f9ff', minHeight: '100vh' },
  header: { borderBottom: '2px solid #0077b6', paddingBottom: '15px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#0077b6', margin: 0, fontSize: '1.8rem' },
  drInfo: { textAlign: 'right', fontSize: '0.9rem', color: '#555' },
  container: { display: 'flex', gap: '20px' },
  panel: { backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', flex: 1 },
  patientPanel: { flex: '0 0 40%' },
  drugPanel: { flex: '0 0 55%' },
  sectionTitle: { borderBottom: '1px solid #ccc', paddingBottom: '10px', marginTop: 0, color: '#005f99' },
  inputGroup: { marginBottom: '15px' },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' },
  input: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', boxSizing: 'border-box' },
  checkboxGroup: { display: 'flex', gap: '15px' },
  resultBox: { backgroundColor: '#e0f2fe', padding: '15px', borderRadius: '5px', border: '1px solid #7dd3fc', marginTop: '15px' },
  alertBox: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: '15px', borderRadius: '5px', border: '1px solid #fecaca', marginTop: '15px' },
  prescriptionText: { fontSize: '1.1rem', fontWeight: 'bold', color: '#0369a1', margin: 0 },
  addBtn: { backgroundColor: '#0284c7', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '5px', cursor: 'pointer', fontSize: '1rem', width: '100%' },
  ordList: { marginTop: '20px', listStyle: 'none', padding: 0 },
  ordItem: { backgroundColor: '#f9fafb', border: '1px solid #eee', padding: '10px', borderRadius: '5px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
};

function PediaPrescribeApp() {
  const drName = "Dr Tarek Ali";
  const hospName = "Hôpital Universitaire de Gafsa";

  // Patient State
  const [patient, setPatient] = useState({
    name: '',
    dob: '',
    weight: '', // en kg
    allergies: '',
    history: '',
    contraindications: '',
  });

  // Prescription State
  const [selectedDrug, setSelectedDrug] = useState(DRUG_DATABASE[0]);
  const [currentPrescription, setCurrentPrescription] = useState([]);
  const [customMgPerKg, setCustomMgPerKg] = useState('');
  const [selectedConc, setSelectedConc] = useState(0); // Index de la concentration

  // Calcul Automatique de Dose
  const dosage = useMemo(() => {
    if (!selectedDrug || !patient.weight || patient.weight <= 0) return null;

    const weight = parseFloat(patient.weight);
    const concentration = selectedDrug.concentrations[selectedConc];
    
    // Si forme fixe (suppositoire)
    if (concentration.fixedDose) {
      return {
        type: 'fixed',
        instructions: `Prendre 1 ${selectedDrug.form} de ${concentration.fixedDose} mg`,
        dailyTotal: `Dose totale selon la posologie médicale.`
      };
    }

    // Sinon forme liquide
    const doseToUse = customMgPerKg ? parseFloat(customMgPerKg) : selectedDrug.pediatricDose.standard;
    const dosesPerDay = selectedDrug.pediatricDose.dosesPerDay;

    const mgPerDose = (weight * doseToUse) / dosesPerDay;
    const mlPerDose = mgPerDose / concentration.mgPerMl;
    const mlPerDoseRounding = Math.round(mlPerDose * 10) / 10; // Arrondi à 0.1 ml pour précision pédiatrique

    return {
      type: 'liquid',
      mgPerKg: doseToUse,
      mgPerDose: Math.round(mgPerDose * 10) / 10,
      mlPerDose: mlPerDoseRounding,
      instructions: `Donner ${mlPerDoseRounding} ml (${selectedDrug.form}) ${dosesPerDay} fois par jour.`
    };
  }, [selectedDrug, patient.weight, customMgPerKg, selectedConc]);

  // Contrôles de Sécurité (Alertes)
  const securityAlerts = useMemo(() => {
    const alerts = [];
    if (!selectedDrug) return [];

    // 1. Allergies
    if (patient.allergies.toLowerCase().includes('pénicilline') && selectedDrug.dci.toLowerCase().includes('amoxicilline')) {
      alerts.push(`CONTRE-INDICATION ABSOLUE : Allergie croisée aux pénicillines.`);
    }

    // 2. Posologie Max
    if (dosage && customMgPerKg) {
      const doseMg = parseFloat(customMgPerKg);
      if (doseMg > selectedDrug.pediatricDose.max) {
        alerts.push(`ERREUR POSOLOGIQUE : La dose (${doseMg} mg/kg/j) dépasse la dose max recommandée (${selectedDrug.pediatricDose.max} mg/kg/j).`);
      }
    }

    return alerts;
  }, [selectedDrug, patient.allergies, customMgPerKg, dosage]);

  // Ajouter à l'ordonnance
  const addToOrdonnance = () => {
    if (securityAlerts.length > 0) {
      alert("Erreur de sécurité détectée. Impossible d'ajouter.");
      return;
    }
    if (!dosage) return;

    const newItem = {
      dci: selectedDrug.dci,
      brand: selectedDrug.brandName,
      instructions: dosage.instructions
    };

    setCurrentPrescription([...currentPrescription, newItem]);
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>PEDIAPRESCRIBE v1.0</h1>
        <div style={styles.drInfo}>
          <strong>{drName}</strong><br />
          Chef de Service - Pédiatrie<br />
          {hospName}
        </div>
      </header>

      <div style={styles.container}>
        {/* FICHE PATIENT */}
        <div style={{ ...styles.panel, ...styles.patientPanel }}>
          <h2 style={styles.sectionTitle}>1. Fiche Patient (kg/âge)</h2>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nom & Prénom</label>
            <input type="text" placeholder="Enfant Ben Ali" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Date de Naissance (JJ/MM/AAAA)</label>
            <input type="text" placeholder="01/01/2021" value={patient.dob} onChange={e => setPatient({...patient, dob: e.target.value})} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Poids du Jour (kg)</label>
            <input type="number" placeholder="12" value={patient.weight} onChange={e => setPatient({...patient, weight: e.target.value})} style={{...styles.input, backgroundColor: '#fffbe3'}} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Allergies</label>
            <input type="text" placeholder="Pénicilline" value={patient.allergies} onChange={e => setPatient({...patient, allergies: e.target.value})} style={styles.input} />
          </div>
        </div>

        {/* CALCULATEUR & PRESCRIPTION */}
        <div style={{ ...styles.panel, ...styles.drugPanel }}>
          <h2 style={styles.sectionTitle}>2. Médicament & Calcul de Dose (mg/kg)</h2>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Sélectionner le médicament (Tunisie)</label>
            <select style={styles.input} value={selectedDrug.id} onChange={e => {
              const drug = DRUG_DATABASE.find(d => d.id === e.target.value);
              setSelectedDrug(drug);
              setSelectedConc(0);
              setCustomMgPerKg(''); // Reset custom dose
            }}>
              {DRUG_DATABASE.map(drug => (
                <option key={drug.id} value={drug.id}>{drug.dci} - {drug.brandName} ({drug.category})</option>
              ))}
            </select>
          </div>

          
