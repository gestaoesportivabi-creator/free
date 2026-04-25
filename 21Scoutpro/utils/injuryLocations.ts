export const INJURY_LOCATIONS_BY_TYPE: Record<string, string[]> = {
  Muscular: [
    'Coxa Posterior', 'Coxa Anterior', 'Quadríceps', 'Isquiostibiais',
    'Panturrilha', 'Glúteo', 'Adutor', 'Bíceps Braquial', 'Tríceps',
    'Tendão de Aquiles', 'Tendão Patelar',
  ],
  Trauma: [
    'Tornozelo', 'Joelho', 'Pé', 'Dedos do Pé', 'Calcâneo', 'Metatarso',
    'Fêmur', 'Tíbia', 'Fíbula', 'Ombro', 'Braço', 'Antebraço', 'Punho',
    'Mão', 'Dedos da Mão', 'Úmero', 'Rádio', 'Ulna', 'Clavícula',
    'Escápula', 'Esternão', 'Costelas', 'Cabeça', 'Face', 'Mandíbula',
    'Dentes', 'Nariz', 'Olho', 'Orelha',
  ],
  Articular: [
    'Joelho', 'Tornozelo', 'Ombro', 'Punho', 'Quadril', 'Cotovelo',
    'Ligamento Cruzado Anterior', 'Ligamento Cruzado Posterior',
    'Ligamento Colateral Medial', 'Ligamento Colateral Lateral',
    'Menisco', 'Coluna Cervical', 'Coluna Torácica', 'Coluna Lombar',
  ],
  Outros: [
    'Coxa Posterior', 'Coxa Anterior', 'Quadríceps', 'Isquiostibiais',
    'Panturrilha', 'Tornozelo', 'Joelho', 'Pé', 'Dedos do Pé', 'Calcâneo',
    'Metatarso', 'Fêmur', 'Tíbia', 'Fíbula', 'Glúteo', 'Adutor',
    'Ombro', 'Braço', 'Bíceps Braquial', 'Tríceps', 'Antebraço', 'Punho',
    'Mão', 'Dedos da Mão', 'Úmero', 'Rádio', 'Ulna', 'Clavícula',
    'Escápula', 'Tórax', 'Costas', 'Lombar', 'Coluna Cervical',
    'Coluna Torácica', 'Coluna Lombar', 'Pescoço', 'Esternão', 'Costelas',
    'Pelve', 'Sacro', 'Cabeça', 'Face', 'Mandíbula', 'Dentes', 'Nariz',
    'Olho', 'Orelha', 'Ligamento Cruzado Anterior', 'Ligamento Cruzado Posterior',
    'Ligamento Colateral Medial', 'Ligamento Colateral Lateral', 'Menisco',
    'Tendão de Aquiles', 'Tendão Patelar', 'Outros',
  ],
};

export const WELLNESS_PAIN_LOCATION_OPTIONS = INJURY_LOCATIONS_BY_TYPE.Outros;
export const WELLNESS_PAIN_TYPE_OPTIONS = ['Muscular', 'Trauma', 'Articular', 'Outros'] as const;
export const WELLNESS_PAIN_SIDE_OPTIONS = ['Direito', 'Esquerdo', 'Bilateral', 'N/A'] as const;
