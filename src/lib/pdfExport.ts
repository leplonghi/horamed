import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportData {
  userEmail: string;
  profile: {
    full_name?: string;
    nickname?: string;
    birth_date?: string;
    height_cm?: number;
    weight_kg?: number;
  };
  bmi?: string;
  items: Array<{
    name: string;
    dose_text: string | null;
    category: string;
    with_food: boolean;
    notes?: string | null;
    schedules: Array<{
      times: any;
      freq_type: string;
      days_of_week?: number[];
    }>;
    stock?: Array<{
      units_left: number;
      units_total: number;
      unit_label: string;
      projected_end_at?: string;
    }>;
  }>;
  healthHistory: Array<{
    recorded_at: string;
    weight_kg: number | null;
    height_cm: number | null;
  }>;
  doseInstances?: Array<{
    id: string;
    status: string;
    due_at: string;
    taken_at: string | null;
    item_id: string;
    items: { name: string };
  }>;
  period?: number;
}

const COLORS = {
  primary: [82, 109, 255] as [number, number, number],
  secondary: [100, 116, 139] as [number, number, number],
  accent: [244, 114, 182] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [234, 179, 8] as [number, number, number],
  background: [249, 250, 251] as [number, number, number],
};

export async function generateCompletePDF(data: ExportData, logoImage?: string) {
  const doc = new jsPDF();
  let yPos = 20;

  // Helper function to add logo
  const addLogo = () => {
    if (logoImage) {
      try {
        doc.addImage(logoImage, 'WEBP', 15, yPos, 30, 30);
        yPos += 35;
      } catch (error) {
        console.error('Error adding logo:', error);
        yPos += 5;
      }
    }
  };

  // Header with logo
  addLogo();
  
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.text('MedHora - Relatorio Completo', 105, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.secondary);
  const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.text(`Gerado em: ${currentDate}`, 105, yPos, { align: 'center' });
  yPos += 15;

  // Section: Personal Data
  doc.setFillColor(...COLORS.primary);
  doc.rect(15, yPos, 180, 8, 'F');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('Dados Pessoais', 20, yPos + 5.5);
  yPos += 15;

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Nome: ${data.profile.full_name || 'Nao informado'}`, 20, yPos);
  yPos += 7;
  doc.text(`Email: ${data.userEmail}`, 20, yPos);
  yPos += 15;

  // Section: Health Data
  doc.setFillColor(...COLORS.primary);
  doc.rect(15, yPos, 180, 8, 'F');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('Dados de Saude', 20, yPos + 5.5);
  yPos += 15;

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  
  const height = data.profile.height_cm ? (data.profile.height_cm / 100).toFixed(2) + ' m' : 'Nao informado';
  const weight = data.profile.weight_kg ? data.profile.weight_kg + ' kg' : 'Nao informado';
  
  doc.text(`Altura: ${height}`, 20, yPos);
  yPos += 7;
  doc.text(`Peso: ${weight}`, 20, yPos);
  yPos += 7;
  
  if (data.bmi) {
    const bmiValue = parseFloat(data.bmi);
    let bmiStatus = '';
    if (bmiValue < 18.5) bmiStatus = 'Abaixo do peso';
    else if (bmiValue < 25) bmiStatus = 'Peso normal';
    else if (bmiValue < 30) bmiStatus = 'Sobrepeso';
    else bmiStatus = 'Obesidade';
    
    doc.setTextColor(...COLORS.accent);
    doc.setFontSize(12);
    doc.text(`IMC: ${data.bmi} - ${bmiStatus}`, 20, yPos);
    yPos += 12;
  } else {
    yPos += 5;
  }

  // Section: Health History
  if (data.healthHistory && data.healthHistory.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(...COLORS.primary);
    doc.rect(15, yPos, 180, 8, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('Historico de Evolucao', 20, yPos + 5.5);
    yPos += 15;

    const historyData = data.healthHistory.map(h => {
      const bmi = h.weight_kg && h.height_cm 
        ? (h.weight_kg / Math.pow(h.height_cm / 100, 2)).toFixed(1)
        : '-';
      return [
        format(new Date(h.recorded_at), 'dd/MM/yyyy', { locale: ptBR }),
        h.weight_kg ? `${h.weight_kg} kg` : '-',
        h.height_cm ? `${(h.height_cm / 100).toFixed(2)} m` : '-',
        bmi,
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Data', 'Peso', 'Altura', 'IMC']],
      body: historyData,
      theme: 'striped',
      headStyles: { 
        fillColor: COLORS.primary,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: { 
        fontSize: 9,
        textColor: [60, 60, 60],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Section: Medications & Stock
  if (data.items && data.items.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(...COLORS.primary);
    doc.rect(15, yPos, 180, 8, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('Medicamentos e Estoque', 20, yPos + 5.5);
    yPos += 15;

    const categoryLabels: Record<string, string> = {
      medicamento: 'Medicamento',
      vitamina: 'Vitamina',
      suplemento: 'Suplemento',
      outro: 'Outro',
    };

    const itemsData = data.items.map(item => {
      const stock = item.stock?.[0];
      const stockText = stock ? `${stock.units_left} ${stock.unit_label}` : 'Sem estoque';
      
      return [
        item.name,
        categoryLabels[item.category] || item.category,
        item.dose_text || '-',
        item.with_food ? 'Sim' : 'Nao',
        stockText,
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Medicamento', 'Categoria', 'Dosagem', 'Com alimento', 'Estoque']],
      body: itemsData,
      theme: 'striped',
      styles: {
        font: 'helvetica',
      },
      headStyles: { 
        fillColor: COLORS.primary,
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: { 
        fontSize: 8,
        textColor: [60, 60, 60],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Section: Schedule/Calendar
  if (data.items && data.items.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(...COLORS.primary);
    doc.rect(15, yPos, 180, 8, 'F');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('Calendario de Medicamentos', 20, yPos + 5.5);
    yPos += 15;

    const scheduleData: any[] = [];
    
    data.items.forEach(item => {
      if (item.schedules && item.schedules.length > 0) {
        item.schedules.forEach(schedule => {
          const times = schedule.times || [];
          const timesText = Array.isArray(times) 
            ? times.map((t: any) => typeof t === 'string' ? t : t.time || 'Nao definido').join(', ')
            : JSON.stringify(times) !== '{}' ? JSON.stringify(times) : 'Nao definido';
          
          const freqLabels: Record<string, string> = {
            daily: 'Diariamente',
            weekly: 'Semanalmente',
            monthly: 'Mensalmente',
            specific_days: 'Dias especificos',
          };

          scheduleData.push([
            item.name,
            freqLabels[schedule.freq_type] || schedule.freq_type,
            timesText,
          ]);
        });
      } else {
        scheduleData.push([
          item.name,
          'Sem agendamento',
          '-',
        ]);
      }
    });

    if (scheduleData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Medicamento', 'Frequencia', 'Horarios']],
        body: scheduleData,
        theme: 'striped',
        styles: {
          font: 'helvetica',
        },
        headStyles: { 
          fillColor: COLORS.primary,
          fontSize: 10,
          fontStyle: 'bold',
        },
        bodyStyles: { 
          fontSize: 9,
          textColor: [60, 60, 60],
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        margin: { left: 15, right: 15 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Nenhum horario agendado encontrado.', 20, yPos);
      yPos += 10;
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.secondary);
    doc.text(
      `Página ${i} de ${pageCount} | MedHora - Gestão de Medicamentos`,
      105,
      287,
      { align: 'center' }
    );
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.text(
      'Este relatorio e apenas informativo e nao substitui consulta medica.',
      105,
      292,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `horamend-relatorio-completo-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(fileName);
}

export async function generateMedicationReport(data: ExportData, logoImage?: string) {
  const doc = new jsPDF();
  const { addHeader, addSectionHeader, addFooter, checkPageBreak, getCategoryLabels, getFrequencyLabels } = await import('./pdfReportTypes');
  
  let yPos = addHeader(doc, 'Relatório de Medicamentos', 'Lista completa de medicamentos ativos', 20, logoImage);

  // Personal Info
  yPos = addSectionHeader(doc, 'Dados do Paciente', yPos);
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Nome: ${data.profile.full_name || data.profile.nickname || 'Não informado'}`, 20, yPos);
  yPos += 7;
  doc.text(`Email: ${data.userEmail}`, 20, yPos);
  yPos += 15;

  // Medications Table
  if (data.items && data.items.length > 0) {
    yPos = checkPageBreak(doc, yPos, 60);
    yPos = addSectionHeader(doc, 'Medicamentos Ativos', yPos);

    const categoryLabels = getCategoryLabels();
    const itemsData = data.items.map(item => {
      const stock = item.stock?.[0];
      const stockText = stock 
        ? `${stock.units_left}/${stock.units_total} ${stock.unit_label}`
        : 'Sem estoque';
      
      const notes = item.notes || '-';
      
      return [
        item.name,
        categoryLabels[item.category] || item.category,
        item.dose_text || '-',
        item.with_food ? 'Sim' : 'Não',
        stockText,
        notes.substring(0, 40) + (notes.length > 40 ? '...' : ''),
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Medicamento', 'Categoria', 'Dosagem', 'Com alimento', 'Estoque', 'Observações']],
      body: itemsData,
      theme: 'striped',
      headStyles: { 
        fillColor: COLORS.primary,
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: { 
        fontSize: 8,
        textColor: [60, 60, 60],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Schedule Details
    yPos = checkPageBreak(doc, yPos, 60);
    yPos = addSectionHeader(doc, 'Horários e Frequências', yPos);

    const freqLabels = getFrequencyLabels();
    const scheduleData: any[] = [];
    
    data.items.forEach(item => {
      if (item.schedules && item.schedules.length > 0) {
        item.schedules.forEach(schedule => {
          const times = schedule.times || [];
          const timesText = Array.isArray(times) 
            ? times.map((t: any) => typeof t === 'string' ? t : t.time || 'Não definido').join(', ')
            : 'Não definido';
          
          scheduleData.push([
            item.name,
            freqLabels[schedule.freq_type] || schedule.freq_type,
            timesText,
          ]);
        });
      }
    });

    if (scheduleData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Medicamento', 'Frequência', 'Horários']],
        body: scheduleData,
        theme: 'striped',
        headStyles: { 
          fillColor: COLORS.primary,
          fontSize: 10,
          fontStyle: 'bold',
        },
        bodyStyles: { 
          fontSize: 9,
          textColor: [60, 60, 60],
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        margin: { left: 15, right: 15 },
      });
    }
  }

  addFooter(doc);
  const fileName = `horamend-medicamentos-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(fileName);
}

export async function generateProgressReport(data: ExportData, logoImage?: string) {
  const doc = new jsPDF();
  const { addHeader, addSectionHeader, addFooter, checkPageBreak } = await import('./pdfReportTypes');
  
  let yPos = addHeader(doc, 'Relatório de Progresso', `Análise dos últimos ${data.period || 30} dias`, 20, logoImage);

  // Summary Statistics
  yPos = addSectionHeader(doc, 'Estatísticas Gerais', yPos);

  if (data.doseInstances && data.doseInstances.length > 0) {
    const taken = data.doseInstances.filter(d => d.status === 'taken').length;
    const missed = data.doseInstances.filter(d => d.status === 'missed' || d.status === 'skipped').length;
    const total = data.doseInstances.length;
    const progressRate = total > 0 ? ((taken / total) * 100).toFixed(1) : '0';

    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(`Total de doses programadas: ${total}`, 20, yPos);
    yPos += 8;
    
    doc.setTextColor(...COLORS.success);
    doc.text(`Doses tomadas: ${taken} (${progressRate}%)`, 20, yPos);
    yPos += 8;
    
    doc.setTextColor(...COLORS.warning);
    doc.text(`Doses perdidas/puladas: ${missed}`, 20, yPos);
    yPos += 15;

    // By Medication
    yPos = checkPageBreak(doc, yPos, 60);
    yPos = addSectionHeader(doc, 'Aderência por Medicamento', yPos);

    const medicationStats: Record<string, { taken: number; total: number }> = {};
    
    data.doseInstances.forEach(dose => {
      const medName = dose.items.name;
      if (!medicationStats[medName]) {
        medicationStats[medName] = { taken: 0, total: 0 };
      }
      medicationStats[medName].total++;
      if (dose.status === 'taken') {
        medicationStats[medName].taken++;
      }
    });

    const medData = Object.entries(medicationStats).map(([name, stats]) => {
      const rate = ((stats.taken / stats.total) * 100).toFixed(1);
      return [
        name,
        stats.taken.toString(),
        stats.total.toString(),
        `${rate}%`,
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Medicamento', 'Tomadas', 'Total', 'Taxa']],
      body: medData,
      theme: 'striped',
      headStyles: { 
        fillColor: COLORS.primary,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: { 
        fontSize: 9,
        textColor: [60, 60, 60],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Recent History
    yPos = checkPageBreak(doc, yPos, 60);
    yPos = addSectionHeader(doc, 'Histórico Recente (últimas 20 doses)', yPos);

    const recentDoses = data.doseInstances
      .slice(0, 20)
      .map(dose => [
        format(new Date(dose.due_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        dose.items.name,
        dose.status === 'taken' ? 'Tomada' : dose.status === 'missed' ? 'Perdida' : 'Pulada',
        dose.taken_at ? format(new Date(dose.taken_at), 'HH:mm', { locale: ptBR }) : '-',
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Data/Hora', 'Medicamento', 'Status', 'Tomada em']],
      body: recentDoses,
      theme: 'striped',
      headStyles: { 
        fillColor: COLORS.primary,
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: { 
        fontSize: 8,
        textColor: [60, 60, 60],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 15, right: 15 },
    });
  } else {
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Nenhum dado de aderência encontrado para o período selecionado.', 20, yPos);
  }

  addFooter(doc, 'Consulte seu médico para discutir sua aderência ao tratamento.');
  const fileName = `horamend-aderencia-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(fileName);
}

export async function generateHealthReport(data: ExportData, logoImage?: string) {
  const doc = new jsPDF();
  const { addHeader, addSectionHeader, addFooter, checkPageBreak, calculateAge, getBMIStatus } = await import('./pdfReportTypes');
  
  let yPos = addHeader(doc, 'Relatório de Saúde', `Evolução dos últimos ${data.period || 30} dias`, 20, logoImage);

  // Personal Info
  yPos = addSectionHeader(doc, 'Dados do Paciente', yPos);
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Nome: ${data.profile.full_name || data.profile.nickname || 'Não informado'}`, 20, yPos);
  yPos += 7;
  
  if (data.profile.birth_date) {
    const age = calculateAge(data.profile.birth_date);
    doc.text(`Idade: ${age} anos`, 20, yPos);
    yPos += 7;
  }
  
  doc.text(`Email: ${data.userEmail}`, 20, yPos);
  yPos += 15;

  // Current Health Data
  yPos = checkPageBreak(doc, yPos, 50);
  yPos = addSectionHeader(doc, 'Dados Atuais de Saúde', yPos);

  const height = data.profile.height_cm ? (data.profile.height_cm / 100).toFixed(2) + ' m' : 'Não informado';
  const weight = data.profile.weight_kg ? data.profile.weight_kg + ' kg' : 'Não informado';
  
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Altura: ${height}`, 20, yPos);
  yPos += 7;
  doc.text(`Peso: ${weight}`, 20, yPos);
  yPos += 7;
  
  if (data.bmi) {
    const bmiValue = parseFloat(data.bmi);
    const bmiStatus = getBMIStatus(bmiValue);
    
    doc.setTextColor(...COLORS.accent);
    doc.setFontSize(12);
    doc.text(`IMC: ${data.bmi} - ${bmiStatus}`, 20, yPos);
    yPos += 15;
  } else {
    yPos += 8;
  }

  // Health History
  if (data.healthHistory && data.healthHistory.length > 0) {
    yPos = checkPageBreak(doc, yPos, 60);
    yPos = addSectionHeader(doc, 'Histórico de Evolução', yPos);

    const historyData = data.healthHistory.map(h => {
      const bmi = h.weight_kg && h.height_cm 
        ? (h.weight_kg / Math.pow(h.height_cm / 100, 2)).toFixed(1)
        : '-';
      return [
        format(new Date(h.recorded_at), 'dd/MM/yyyy', { locale: ptBR }),
        h.weight_kg ? `${h.weight_kg} kg` : '-',
        h.height_cm ? `${(h.height_cm / 100).toFixed(2)} m` : '-',
        bmi,
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Data', 'Peso', 'Altura', 'IMC']],
      body: historyData,
      theme: 'striped',
      headStyles: { 
        fillColor: COLORS.primary,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: { 
        fontSize: 9,
        textColor: [60, 60, 60],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 15, right: 15 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Weight Analysis
    if (data.healthHistory.length >= 2) {
      yPos = checkPageBreak(doc, yPos, 40);
      yPos = addSectionHeader(doc, 'Análise de Tendência', yPos);

      const firstRecord = data.healthHistory[data.healthHistory.length - 1];
      const lastRecord = data.healthHistory[0];

      if (firstRecord.weight_kg && lastRecord.weight_kg) {
        const weightDiff = lastRecord.weight_kg - firstRecord.weight_kg;
        const weightChange = weightDiff > 0 ? `+${weightDiff.toFixed(1)}` : weightDiff.toFixed(1);
        
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);
        doc.text(`Variação de peso no período: ${weightChange} kg`, 20, yPos);
        yPos += 7;

        if (firstRecord.height_cm && firstRecord.height_cm === lastRecord.height_cm) {
          const firstBmi = firstRecord.weight_kg / Math.pow(firstRecord.height_cm / 100, 2);
          const lastBmi = lastRecord.weight_kg / Math.pow(lastRecord.height_cm / 100, 2);
          const bmiDiff = lastBmi - firstBmi;
          const bmiChange = bmiDiff > 0 ? `+${bmiDiff.toFixed(1)}` : bmiDiff.toFixed(1);
          
          doc.text(`Variação de IMC no período: ${bmiChange}`, 20, yPos);
          yPos += 10;
        }
      }
    }
  } else {
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Nenhum histórico de saúde registrado.', 20, yPos);
  }

  addFooter(doc, 'Mantenha um acompanhamento regular com seu médico.');
  const fileName = `horamend-saude-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(fileName);
}
