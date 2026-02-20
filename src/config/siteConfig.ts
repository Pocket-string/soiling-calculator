// ============================================================
// SITE CONFIG - Soiling Calc: SaaS de Monitoreo Fotovoltaico
// ============================================================

export interface ServiceItem {
  icon: 'soiling' | 'irradiance' | 'cleaning' | 'export' | 'monitoring' | 'custom'
  title: string
  slug: string
  shortDescription: string
  fullDescription: string
}

export interface TeamMember {
  name: string
  title: string
  bio: string
  specialties: string[]
  imageUrl?: string
}

export interface Testimonial {
  name: string
  quote: string
  rating: number
  caseType?: string
}

export interface NavItem {
  label: string
  href: string
  children?: { label: string; href: string }[]
}

export interface SiteConfig {
  firmName: string
  firmSlogan: string
  firmDescription: string
  founderName: string
  founderTitle: string
  founderBio: string
  yearsExperience: number
  yearFounded: number

  contact: {
    phone: string
    phoneDisplay: string
    email: string
    address: string
    city: string
    country: string
    googleMapsEmbedUrl: string
    whatsappNumber?: string
    officeHours: string
  }

  social: {
    facebook?: string
    instagram?: string
    linkedin?: string
    twitter?: string
  }

  navigation: {
    items: NavItem[]
  }

  hero: {
    headline: string
    subheadline: string
    ctaText: string
    ctaHref: string
    backgroundImageUrl?: string
  }

  values: Array<{
    icon: 'respect' | 'quality' | 'team' | 'experience' | 'confidential' | 'results'
    title: string
    description: string
  }>

  services: ServiceItem[]

  tabs: Array<{
    title: string
    content: string
  }>

  team: TeamMember[]

  testimonials: Testimonial[]

  booking: {
    enabled: boolean
    ctaText: string
  }

  seo: {
    siteTitle: string
    titleTemplate: string
    defaultDescription: string
    locale: string
    ogImageUrl?: string
  }

  legal: {
    privacyLastUpdated: string
    termsLastUpdated: string
  }

  theme?: {
    primaryColor?: string
    accentColor?: string
  }
}

// ============================================================
// CONFIGURACIÓN: Soiling Calc - Calculadora de Soiling Solar
// ============================================================

export const siteConfig: SiteConfig = {
  firmName: 'Soiling Calc',
  firmSlogan: 'Monitorea la suciedad de tus paneles solares',
  firmDescription: 'Plataforma SaaS para el monitoreo del soiling fotovoltaico. Calcula el Performance Ratio, las pérdidas por suciedad y te recomienda cuando limpiar tus paneles con datos de irradiancia reales.',
  founderName: 'Equipo Soiling Calc',
  founderTitle: 'Ingeniería Solar Aplicada',
  founderBio: 'Soiling Calc nace de la necesidad real de los operadores de plantas fotovoltaicas de saber cuando limpiar sus paneles. Combinamos datos meteorológicos en tiempo real con modelos térmicos (NOCT) para ofrecer cálculos precisos de soiling y recomendaciones de limpieza basadas en análisis coste-beneficio.',
  yearsExperience: 5,
  yearFounded: 2024,

  contact: {
    phone: '',
    phoneDisplay: '',
    email: 'hola@soilingcalc.com',
    address: '',
    city: 'Madrid',
    country: 'España',
    googleMapsEmbedUrl: '',
    officeHours: 'Soporte por email: Lunes a Viernes',
  },

  social: {
    linkedin: 'https://linkedin.com/company/soilingcalc',
  },

  navigation: {
    items: [
      { label: 'Inicio', href: '/' },
      {
        label: 'Producto',
        href: '/servicios',
        children: [
          { label: 'Cálculo de Soiling', href: '/servicios#soiling' },
          { label: 'Irradiancia Real', href: '/servicios#irradiancia' },
          { label: 'Recomendación de Limpieza', href: '/servicios#limpieza' },
        ],
      },
      { label: 'Demo', href: '/demo' },
      { label: 'Solicitar Acceso', href: '/apply' },
      { label: 'Contacto', href: '/contacto' },
    ],
  },

  hero: {
    headline: 'Monitorea la suciedad de tus paneles solares',
    subheadline: 'Calcula el soiling, el Performance Ratio y recibe recomendaciones de limpieza basadas en datos reales de irradiancia. Optimiza el rendimiento de tu instalación fotovoltaica.',
    ctaText: 'Ver Demo',
    ctaHref: '/demo',
  },

  values: [
    {
      icon: 'quality',
      title: 'Precisión Científica',
      description: 'Modelo térmico NOCT con corrección por temperatura real del módulo. Irradiancia POA calculada desde datos GHI de Open-Meteo.',
    },
    {
      icon: 'results',
      title: 'Resultados Accionables',
      description: 'No solo te decimos cuanto soiling tienes. Te recomendamos cuando limpiar basándonos en un análisis coste-beneficio real.',
    },
    {
      icon: 'experience',
      title: 'Sin Hardware Adicional',
      description: 'Solo necesitas el dato de producción de tu inversor. Nosotros obtenemos la irradiancia automáticamente según tu ubicación.',
    },
  ],

  services: [
    {
      icon: 'soiling',
      title: 'Cálculo de Soiling',
      slug: 'soiling',
      shortDescription: 'Mide cuanto rendimiento pierden tus paneles por acumulación de suciedad, polvo y partículas.',
      fullDescription: 'El soiling es la pérdida de rendimiento causada por la acumulación de suciedad sobre los paneles solares. Nuestro algoritmo compara la producción real de tu planta con la producción teórica esperada (calculada con irradiancia real y corrección térmica NOCT) para determinar el porcentaje exacto de pérdida por soiling. El cálculo se actualiza con cada lectura que registras.',
    },
    {
      icon: 'irradiance',
      title: 'Irradiancia Real por Ubicación',
      slug: 'irradiancia',
      shortDescription: 'Datos meteorológicos reales de la API Open-Meteo, automáticamente para la ubicación de tu planta.',
      fullDescription: 'No necesitas estación meteorológica propia. Soiling Calc obtiene automáticamente los datos de irradiancia global horizontal (GHI) de la API Open-Meteo para las coordenadas exactas de tu instalación. Convertimos GHI a irradiancia en el plano del array (POA) considerando la inclinación y orientación de tus paneles. Los datos se cachean para evitar llamadas redundantes.',
    },
    {
      icon: 'cleaning',
      title: 'Recomendación de Limpieza',
      slug: 'limpieza',
      shortDescription: 'Te dice cuando limpiar basándose en un análisis coste-beneficio: pérdida acumulada vs. coste de limpieza.',
      fullDescription: 'La recomendación de limpieza no es un umbral arbitrario. Soiling Calc calcula las pérdidas económicas acumuladas por soiling (en euros) y las compara con el coste de limpieza que defines para tu planta. Cuando las pérdidas superan el coste de limpieza, recibes la recomendación de limpiar. Así maximizas el ROI de cada operación de mantenimiento.',
    },
  ],

  tabs: [
    {
      title: 'Performance Ratio',
      content: 'El Performance Ratio (PR) es el indicador estándar de la industria fotovoltaica para medir la eficiencia real de una instalación. Soiling Calc calcula el PR comparando la producción real (kWh medidos por tu inversor) con la producción teórica esperada bajo las condiciones meteorológicas del día. Un PR del 80% significa que tu planta produce el 80% de lo que debería en condiciones ideales.',
    },
    {
      title: 'Modelo NOCT',
      content: 'El modelo NOCT (Nominal Operating Cell Temperature) corrige la potencia nominal del módulo por la temperatura real de operación. Los paneles solares pierden eficiencia al calentarse. Soiling Calc usa la temperatura ambiente real del día, la irradiancia y el valor NOCT de tu módulo para calcular la temperatura de celda y ajustar la producción esperada. Esto elimina el efecto térmico del cálculo de soiling.',
    },
    {
      title: 'Datos Open-Meteo',
      content: 'Open-Meteo es una API meteorológica de código abierto que proporciona datos históricos y en tiempo real de irradiancia solar, temperatura y otras variables para cualquier ubicación del mundo. Soiling Calc usa esta API para obtener automáticamente los datos de GHI (irradiancia global horizontal) y temperatura ambiente para la fecha y ubicación de cada lectura. Los datos se cachean localmente para mayor velocidad.',
    },
  ],

  team: [
    {
      name: 'Equipo Soiling Calc',
      title: 'Ingeniería Solar Aplicada',
      bio: 'Soiling Calc es desarrollado por ingenieros con experiencia en energía solar fotovoltaica y desarrollo de software. Nuestro objetivo es democratizar el acceso a herramientas profesionales de monitoreo de soiling, haciéndolas accesibles para instaladores, operadores y propietarios de plantas solares de cualquier tamaño.',
      specialties: ['Soiling Fotovoltaico', 'Modelos Térmicos', 'Datos Meteorológicos'],
    },
  ],

  testimonials: [
    {
      name: 'Carlos M.',
      quote: 'Antes limpiaba los paneles cada 3 meses por rutina. Con Soiling Calc descubrí que en verano necesito limpiar cada 6 semanas, pero en invierno puedo esperar 4 meses. Ahorro en limpiezas innecesarias.',
      rating: 5,
      caseType: 'Residencial 8 kWp',
    },
    {
      name: 'Ana R.',
      quote: 'La recomendación de limpieza basada en coste-beneficio es exactamente lo que necesitaba. Ya no limpio "por si acaso" sino cuando realmente tiene sentido económico.',
      rating: 5,
      caseType: 'Comercial 50 kWp',
    },
  ],

  booking: {
    enabled: false,
    ctaText: 'Solicitar Acceso',
  },

  seo: {
    siteTitle: 'Soiling Calc | Calculadora de Soiling Fotovoltaico',
    titleTemplate: '%s | Soiling Calc',
    defaultDescription: 'Monitorea el soiling de tus paneles solares. Calcula el Performance Ratio y la recomendación de limpieza con datos de irradiancia reales.',
    locale: 'es_ES',
  },

  legal: {
    privacyLastUpdated: '2026-02-19',
    termsLastUpdated: '2026-02-19',
  },

  theme: {
    primaryColor: '#f59e0b',
    accentColor: '#2563eb',
  },
}
