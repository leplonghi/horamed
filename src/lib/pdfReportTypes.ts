import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = {
  primary: [82, 109, 255] as [number, number, number],
  secondary: [100, 116, 139] as [number, number, number],
  accent: [244, 114, 182] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [234, 179, 8] as [number, number, number],
  background: [249, 250, 251] as [number, number, number],
};

export function addHeader(doc: jsPDF, title: string, subtitle: string, yPos: number = 20, logoImage?: string): number {
  if (logoImage) {
    try {
      doc.addImage(logoImage, 'WEBP', 15, yPos, 30, 30);
      yPos += 35;
    } catch (error) {
      console.error('Error adding logo:', error);
      yPos += 5;
    }
  }
  
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.text(title, 105, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.secondary);
  doc.text(subtitle, 105, yPos, { align: 'center' });
  yPos += 5;

  const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  doc.text(`Gerado em: ${currentDate}`, 105, yPos, { align: 'center' });
  
  return yPos + 15;
}

export function addSectionHeader(doc: jsPDF, title: string, yPos: number, icon?: string): number {
  doc.setFillColor(...COLORS.primary);
  doc.rect(15, yPos, 180, 8, 'F');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 20, yPos + 5.5);
  return yPos + 15;
}

export function addFooter(doc: jsPDF, additionalText?: string) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.secondary);
    doc.text(
      `Página ${i} de ${pageCount} | HoraMed - Gestão de Medicamentos`,
      105,
      287,
      { align: 'center' }
    );
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    const disclaimerText = additionalText || 'Este relatório é apenas informativo e não substitui consulta médica.';
    doc.text(disclaimerText, 105, 292, { align: 'center' });
  }
}

export function checkPageBreak(doc: jsPDF, yPos: number, requiredSpace: number = 50): number {
  if (yPos > 240 - requiredSpace) {
    doc.addPage();
    return 20;
  }
  return yPos;
}

export function getCategoryLabels(): Record<string, string> {
  return {
    medicamento: 'Medicamento',
    vitamina: 'Vitamina',
    suplemento: 'Suplemento',
    outro: 'Outro',
  };
}

export function getFrequencyLabels(): Record<string, string> {
  return {
    daily: 'Diariamente',
    weekly: 'Semanalmente',
    monthly: 'Mensalmente',
    specific_days: 'Dias específicos',
  };
}

export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function getBMIStatus(bmi: number): string {
  if (bmi < 18.5) return 'Abaixo do peso';
  if (bmi < 25) return 'Peso normal';
  if (bmi < 30) return 'Sobrepeso';
  return 'Obesidade';
}
