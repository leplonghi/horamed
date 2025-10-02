import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportData {
  userEmail: string;
  profile: {
    full_name?: string;
    height_cm?: number;
    weight_kg?: number;
  };
  bmi?: string;
  items: Array<{
    name: string;
    dose_text: string | null;
    category: string;
    with_food: boolean;
    schedules: Array<{
      times: any;
      freq_type: string;
    }>;
    stock?: Array<{
      units_left: number;
      unit_label: string;
    }>;
  }>;
  healthHistory: Array<{
    recorded_at: string;
    weight_kg: number | null;
    height_cm: number | null;
  }>;
}

const COLORS = {
  primary: [82, 109, 255] as [number, number, number],
  secondary: [100, 116, 139] as [number, number, number],
  accent: [244, 114, 182] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  background: [249, 250, 251] as [number, number, number],
};

export async function generateCompletePDF(data: ExportData, logoImage?: string) {
  const doc = new jsPDF();
  let yPos = 20;

  // Helper function to add logo
  const addLogo = () => {
    if (logoImage) {
      try {
        doc.addImage(logoImage, 'PNG', 15, yPos, 30, 30);
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
  const fileName = `medhora-relatorio-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
