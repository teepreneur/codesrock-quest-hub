import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import logger from '../utils/logger';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

/**
 * Get all certificates for a user
 * GET /api/certificates/:userId
 */
export const getUserCertificates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Security Check: IDOR Protection
    if (userId !== req.user?.userId && !['super_admin', 'school_admin', 'content_admin'].includes(req.user?.role || '')) {
      logger.warn(`IDOR attempt: User ${req.user?.userId} tried to access certificates of ${userId}`);
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    const { data: certificates, error } = await supabase
      .from('certificates')
      .select('*, courses(title, thumbnail, category)')
      .eq('user_id', userId)
      .order('date_earned', { ascending: false });

    if (error) {
      console.error('Error getting certificates:', error);
      res.status(500).json({ success: false, message: 'Failed to get certificates', error: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      count: certificates?.length || 0,
      data: certificates || [],
    });
  } catch (error: any) {
    console.error('Error in getUserCertificates:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get certificate by ID
 * GET /api/certificates/detail/:id
 */
export const getCertificateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: certificate, error } = await supabase
      .from('certificates')
      .select('*, courses(*), profiles!inner(first_name, last_name)')
      .eq('id', id)
      .single();

    if (error || !certificate) {
      res.status(404).json({ success: false, message: 'Certificate not found' });
      return;
    }

    // Security Check
    if (certificate.user_id !== req.user?.userId && !['super_admin', 'content_admin'].includes(req.user?.role || '')) {
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    res.status(200).json({
      success: true,
      data: certificate,
    });
  } catch (error: any) {
    console.error('Error in getCertificateById:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Generate and stream PDF certificate
 * GET /api/certificates/:id/pdf
 */
export const downloadCertificatePDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: certificate, error } = await supabase
      .from('certificates')
      .select('*, courses(*), profiles(first_name, last_name, school_name)')
      .eq('id', id)
      .single();

    if (error || !certificate) {
      res.status(404).json({ success: false, message: 'Certificate not found' });
      return;
    }

    const recipientName = certificate.profiles
      ? `${certificate.profiles.first_name || ''} ${certificate.profiles.last_name || ''}`.trim()
      : 'STEM Educator';

    const certTitle = certificate.title || 'Level 1: Unplugged Computational Thinking';
    const certNumber = certificate.certificate_number || certificate.certificate_id || `CR-${Date.now()}`;
    const dateEarned = certificate.date_earned
      ? new Date(certificate.date_earned).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Codesrock_Certificate_${certNumber}.pdf`);

    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 0,
    });

    doc.pipe(res);

    // Page dimensions for A4 Landscape in PDF points (841.89 x 595.28)
    const width = 841.89;
    const height = 595.28;

    // Background white fill
    doc.rect(0, 0, width, height).fill('#FFFFFF');

    // Top-Left Decorative Curves
    doc.save()
       .path('M 0,0 L 220,0 C 160,70 110,130 0,180 Z').fill('#5D3B98')
       .path('M 0,0 L 170,0 C 130,50 80,100 0,140 Z').fill('#46C5D5')
       .path('M 0,0 L 120,0 C 90,40 50,80 0,100 Z').fill('#FF7340')
       .path('M 0,0 L 80,0 C 60,25 30,50 0,65 Z').fill('#FDC82F')
       .restore();

    // Top-Right Decorative Curves
    doc.save()
       .path(`M ${width},0 L ${width - 220},0 C ${width - 160},70 ${width - 110},130 ${width},180 Z`).fill('#22C55E')
       .path(`M ${width},0 L ${width - 170},0 C ${width - 130},50 ${width - 80},100 ${width},140 Z`).fill('#FDC82F')
       .path(`M ${width},0 L ${width - 120},0 C ${width - 90},40 ${width - 50},80 ${width},100 Z`).fill('#46C5D5')
       .restore();

    // Bottom-Left Decorative Curves
    doc.save()
       .path(`M 0,${height} L 220,${height} C 160,${height - 70} 110,${height - 130} 0,${height - 180} Z`).fill('#22C55E')
       .path(`M 0,${height} L 170,${height} C 130,${height - 50} 80,${height - 100} 0,${height - 140} Z`).fill('#46C5D5')
       .path(`M 0,${height} L 120,${height} C 90,${height - 40} 50,${height - 80} 0,${height - 100} Z`).fill('#5D3B98')
       .restore();

    // Bottom-Right Decorative Curves
    doc.save()
       .path(`M ${width},${height} L ${width - 220},${height} C ${width - 160},${height - 70} ${width - 110},${height - 130} ${width},${height - 180} Z`).fill('#FF7340')
       .path(`M ${width},${height} L ${width - 170},${height} C ${width - 130},${height - 50} ${width - 80},${height - 100} ${width},${height - 140} Z`).fill('#5D3B98')
       .path(`M ${width},${height} L ${width - 120},${height} C ${width - 90},${height - 40} ${width - 50},${height - 80} ${width},${height - 100} Z`).fill('#FDC82F')
       .restore();

    // Rocky 3D Mascot Image on Right Side
    const rockyImagePath = path.join(__dirname, '../../../codesrock-frontend/public/rocky_celebration_pose.png');
    if (fs.existsSync(rockyImagePath)) {
      doc.image(rockyImagePath, width - 200, height / 2 - 120, { width: 160 });
    }

    // Title & Header Text
    doc.fillColor('#059669')
       .fontSize(32)
       .font('Helvetica-Bold')
       .text('CERTIFICATE', 0, 65, { align: 'center', width: width - 150 });

    doc.fillColor('#312E81')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('OF PARTICIPATION', 0, 105, { align: 'center', width: width - 150 });

    doc.fillColor('#581C87')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text(`CODESROCK QUEST HUB • ${certTitle.toUpperCase()}`, 0, 132, { align: 'center', width: width - 150 });

    doc.fillColor('#475569')
       .fontSize(12)
       .font('Helvetica')
       .text('Proudly Presented to', 0, 165, { align: 'center', width: width - 150 });

    // Recipient Name
    doc.fillColor('#3B0764')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text(recipientName.toUpperCase(), 0, 195, { align: 'center', width: width - 150 });

    // Underline
    doc.strokeColor('#CBD5E1')
       .lineWidth(1.5)
       .moveTo(width / 2 - 180, 230)
       .lineTo(width / 2 + 30, 230)
       .stroke();

    // Citation Body
    doc.fillColor('#334155')
       .fontSize(11)
       .font('Helvetica')
       .text(
         `for active participation, enthusiastic problem-solving, and adventurous teamwork during the ${certTitle} Computational Thinking Quests!`,
         width / 2 - 250,
         245,
         { align: 'center', width: 430 }
       );

    // Quests Explored Box
    doc.roundedRect(width / 2 - 230, 295, 390, 38, 6)
       .fillAndStroke('#F8FAFC', '#E2E8F0');

    doc.fillColor('#581C87')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text('QUESTS EXPLORED', width / 2 - 230, 302, { align: 'center', width: 390 });

    doc.fillColor('#0F766E')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('Unplugged Logic Games • Pattern Recognition • Robot Sequence', width / 2 - 230, 316, { align: 'center', width: 390 });

    // Gold Seal Badge / Crest
    const badgeX = width / 2 - 35;
    const badgeY = 350;
    doc.circle(badgeX, badgeY, 26).fill('#F59E0B');
    doc.circle(badgeX, badgeY, 22).fill('#FBBF24');
    doc.fillColor('#451A03')
       .fontSize(7)
       .font('Helvetica-Bold')
       .text('CODESROCK', badgeX - 22, badgeY - 10, { align: 'center', width: 44 })
       .text('LABS', badgeX - 22, badgeY, { align: 'center', width: 44 })
       .fontSize(6)
       .font('Helvetica-Oblique')
       .text('Honoris Causa', badgeX - 22, badgeY + 9, { align: 'center', width: 44 });

    // Signatures
    const sigY = 430;

    // Ellen Swatson Hall
    doc.fillColor('#312E81')
       .fontSize(16)
       .font('Times-BoldItalic')
       .text('Ellen Hall', width / 2 - 220, sigY - 12, { align: 'center', width: 180 });
    doc.strokeColor('#94A3B8')
       .lineWidth(1)
       .moveTo(width / 2 - 220, sigY + 8)
       .lineTo(width / 2 - 40, sigY + 8)
       .stroke();
    doc.fillColor('#64748B')
       .fontSize(8)
       .font('Helvetica-Bold')
       .text('CODESROCK SCHOOL REPRESENTATIVE', width / 2 - 220, sigY + 12, { align: 'center', width: 180 });
    doc.fillColor('#334155')
       .fontSize(8)
       .font('Helvetica')
       .text('& Quality Lead • Course Director', width / 2 - 220, sigY + 22, { align: 'center', width: 180 });
    doc.fillColor('#581C87')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text('Ellen Swatson Hall', width / 2 - 220, sigY + 33, { align: 'center', width: 180 });

    // Triumph Tetteh
    doc.fillColor('#312E81')
       .fontSize(16)
       .font('Times-BoldItalic')
       .text('Triumph Tetteh', width / 2 - 10, sigY - 12, { align: 'center', width: 180 });
    doc.strokeColor('#94A3B8')
       .lineWidth(1)
       .moveTo(width / 2 - 10, sigY + 8)
       .lineTo(width / 2 + 170, sigY + 8)
       .stroke();
    doc.fillColor('#64748B')
       .fontSize(8)
       .font('Helvetica-Bold')
       .text('DIRECTOR, CODESROCK EDUCATION', width / 2 - 10, sigY + 12, { align: 'center', width: 180 });
    doc.fillColor('#581C87')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text('Triumph Tetteh', width / 2 - 10, sigY + 33, { align: 'center', width: 180 });

    // Footer Info
    doc.fillColor('#64748B')
       .fontSize(8)
       .font('Helvetica')
       .text(`Date Earned: ${dateEarned}`, 70, height - 35)
       .text(`Verify at: codesrock.org/verify/${certNumber}`, width / 2 - 150, height - 35, { align: 'center', width: 200 })
       .text(`ID: ${certNumber}`, width - 260, height - 35, { align: 'right', width: 180 });

    doc.end();
  } catch (error: any) {
    console.error('Error streaming PDF certificate:', error);
    res.status(500).json({ success: false, message: 'Server error generating PDF', error: error.message });
  }
};
