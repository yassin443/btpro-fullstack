import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { Check, Eye, EyeOff, CreditCard, ArrowRight, Shield, ChevronDown, X } from 'lucide-react'
import api from '../../api/axios'
import useStore from '../../store/useStore'
import { PlannerMark } from '../../components/PlannerLogo'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* ── Country codes ─────────────────────────────────────────────────── */
const COUNTRIES = [
    // Algérie en premier
    { iso: 'DZ', flag: '🇩🇿', name: 'Algérie',                       code: '+213',  digits: 9  },
    // Reste par ordre alphabétique (français)
    { iso: 'ZA', flag: '🇿🇦', name: 'Afrique du Sud',                code: '+27',   digits: 9  },
    { iso: 'AF', flag: '🇦🇫', name: 'Afghanistan',                   code: '+93',   digits: 9  },
    { iso: 'AL', flag: '🇦🇱', name: 'Albanie',                       code: '+355',  digits: 9  },
    { iso: 'DE', flag: '🇩🇪', name: 'Allemagne',                     code: '+49',   digits: 11 },
    { iso: 'AD', flag: '🇦🇩', name: 'Andorre',                       code: '+376',  digits: 6  },
    { iso: 'AO', flag: '🇦🇴', name: 'Angola',                        code: '+244',  digits: 9  },
    { iso: 'AG', flag: '🇦🇬', name: 'Antigua-et-Barbuda',            code: '+1268', digits: 7  },
    { iso: 'SA', flag: '🇸🇦', name: 'Arabie Saoudite',               code: '+966',  digits: 9  },
    { iso: 'AR', flag: '🇦🇷', name: 'Argentine',                     code: '+54',   digits: 10 },
    { iso: 'AM', flag: '🇦🇲', name: 'Arménie',                       code: '+374',  digits: 8  },
    { iso: 'AU', flag: '🇦🇺', name: 'Australie',                     code: '+61',   digits: 9  },
    { iso: 'AT', flag: '🇦🇹', name: 'Autriche',                      code: '+43',   digits: 10 },
    { iso: 'AZ', flag: '🇦🇿', name: 'Azerbaïdjan',                   code: '+994',  digits: 9  },
    { iso: 'BS', flag: '🇧🇸', name: 'Bahamas',                       code: '+1242', digits: 7  },
    { iso: 'BH', flag: '🇧🇭', name: 'Bahreïn',                       code: '+973',  digits: 8  },
    { iso: 'BD', flag: '🇧🇩', name: 'Bangladesh',                    code: '+880',  digits: 10 },
    { iso: 'BB', flag: '🇧🇧', name: 'Barbade',                       code: '+1246', digits: 7  },
    { iso: 'BE', flag: '🇧🇪', name: 'Belgique',                      code: '+32',   digits: 9  },
    { iso: 'BZ', flag: '🇧🇿', name: 'Belize',                        code: '+501',  digits: 7  },
    { iso: 'BJ', flag: '🇧🇯', name: 'Bénin',                         code: '+229',  digits: 8  },
    { iso: 'BT', flag: '🇧🇹', name: 'Bhoutan',                       code: '+975',  digits: 8  },
    { iso: 'BY', flag: '🇧🇾', name: 'Biélorussie',                   code: '+375',  digits: 9  },
    { iso: 'BO', flag: '🇧🇴', name: 'Bolivie',                       code: '+591',  digits: 8  },
    { iso: 'BA', flag: '🇧🇦', name: 'Bosnie-Herzégovine',            code: '+387',  digits: 8  },
    { iso: 'BW', flag: '🇧🇼', name: 'Botswana',                      code: '+267',  digits: 8  },
    { iso: 'BR', flag: '🇧🇷', name: 'Brésil',                        code: '+55',   digits: 11 },
    { iso: 'BN', flag: '🇧🇳', name: 'Brunéi',                        code: '+673',  digits: 7  },
    { iso: 'BG', flag: '🇧🇬', name: 'Bulgarie',                      code: '+359',  digits: 9  },
    { iso: 'BF', flag: '🇧🇫', name: 'Burkina Faso',                  code: '+226',  digits: 8  },
    { iso: 'BI', flag: '🇧🇮', name: 'Burundi',                       code: '+257',  digits: 8  },
    { iso: 'CV', flag: '🇨🇻', name: 'Cabo Verde',                    code: '+238',  digits: 7  },
    { iso: 'KH', flag: '🇰🇭', name: 'Cambodge',                      code: '+855',  digits: 9  },
    { iso: 'CM', flag: '🇨🇲', name: 'Cameroun',                      code: '+237',  digits: 9  },
    { iso: 'CA', flag: '🇨🇦', name: 'Canada',                        code: '+1',    digits: 10 },
    { iso: 'CL', flag: '🇨🇱', name: 'Chili',                         code: '+56',   digits: 9  },
    { iso: 'CN', flag: '🇨🇳', name: 'Chine',                         code: '+86',   digits: 11 },
    { iso: 'CY', flag: '🇨🇾', name: 'Chypre',                        code: '+357',  digits: 8  },
    { iso: 'CO', flag: '🇨🇴', name: 'Colombie',                      code: '+57',   digits: 10 },
    { iso: 'KM', flag: '🇰🇲', name: 'Comores',                       code: '+269',  digits: 7  },
    { iso: 'CG', flag: '🇨🇬', name: 'Congo (Rép.)',                  code: '+242',  digits: 9  },
    { iso: 'CD', flag: '🇨🇩', name: 'Congo (RDC)',                   code: '+243',  digits: 9  },
    { iso: 'KP', flag: '🇰🇵', name: 'Corée du Nord',                 code: '+850',  digits: 9  },
    { iso: 'KR', flag: '🇰🇷', name: 'Corée du Sud',                  code: '+82',   digits: 10 },
    { iso: 'CR', flag: '🇨🇷', name: 'Costa Rica',                    code: '+506',  digits: 8  },
    { iso: 'CI', flag: '🇨🇮', name: "Côte d'Ivoire",                 code: '+225',  digits: 10 },
    { iso: 'HR', flag: '🇭🇷', name: 'Croatie',                       code: '+385',  digits: 9  },
    { iso: 'CU', flag: '🇨🇺', name: 'Cuba',                          code: '+53',   digits: 8  },
    { iso: 'DK', flag: '🇩🇰', name: 'Danemark',                      code: '+45',   digits: 8  },
    { iso: 'DJ', flag: '🇩🇯', name: 'Djibouti',                      code: '+253',  digits: 8  },
    { iso: 'DM', flag: '🇩🇲', name: 'Dominique',                     code: '+1767', digits: 7  },
    { iso: 'EG', flag: '🇪🇬', name: 'Égypte',                        code: '+20',   digits: 10 },
    { iso: 'AE', flag: '🇦🇪', name: 'Émirats Arabes Unis',           code: '+971',  digits: 9  },
    { iso: 'EC', flag: '🇪🇨', name: 'Équateur',                      code: '+593',  digits: 9  },
    { iso: 'ER', flag: '🇪🇷', name: 'Érythrée',                      code: '+291',  digits: 7  },
    { iso: 'ES', flag: '🇪🇸', name: 'Espagne',                       code: '+34',   digits: 9  },
    { iso: 'EE', flag: '🇪🇪', name: 'Estonie',                       code: '+372',  digits: 8  },
    { iso: 'SZ', flag: '🇸🇿', name: 'Eswatini',                      code: '+268',  digits: 8  },
    { iso: 'US', flag: '🇺🇸', name: 'États-Unis',                    code: '+1',    digits: 10 },
    { iso: 'ET', flag: '🇪🇹', name: 'Éthiopie',                      code: '+251',  digits: 9  },
    { iso: 'FJ', flag: '🇫🇯', name: 'Fidji',                         code: '+679',  digits: 7  },
    { iso: 'FI', flag: '🇫🇮', name: 'Finlande',                      code: '+358',  digits: 9  },
    { iso: 'FR', flag: '🇫🇷', name: 'France',                        code: '+33',   digits: 10 },
    { iso: 'GA', flag: '🇬🇦', name: 'Gabon',                         code: '+241',  digits: 8  },
    { iso: 'GM', flag: '🇬🇲', name: 'Gambie',                        code: '+220',  digits: 7  },
    { iso: 'GE', flag: '🇬🇪', name: 'Géorgie',                       code: '+995',  digits: 9  },
    { iso: 'GH', flag: '🇬🇭', name: 'Ghana',                         code: '+233',  digits: 9  },
    { iso: 'GR', flag: '🇬🇷', name: 'Grèce',                         code: '+30',   digits: 10 },
    { iso: 'GD', flag: '🇬🇩', name: 'Grenade',                       code: '+1473', digits: 7  },
    { iso: 'GT', flag: '🇬🇹', name: 'Guatemala',                     code: '+502',  digits: 8  },
    { iso: 'GN', flag: '🇬🇳', name: 'Guinée',                        code: '+224',  digits: 9  },
    { iso: 'GQ', flag: '🇬🇶', name: 'Guinée équatoriale',            code: '+240',  digits: 9  },
    { iso: 'GW', flag: '🇬🇼', name: 'Guinée-Bissau',                 code: '+245',  digits: 7  },
    { iso: 'GY', flag: '🇬🇾', name: 'Guyana',                        code: '+592',  digits: 7  },
    { iso: 'HT', flag: '🇭🇹', name: 'Haïti',                         code: '+509',  digits: 8  },
    { iso: 'HN', flag: '🇭🇳', name: 'Honduras',                      code: '+504',  digits: 8  },
    { iso: 'HU', flag: '🇭🇺', name: 'Hongrie',                       code: '+36',   digits: 9  },
    { iso: 'IN', flag: '🇮🇳', name: 'Inde',                          code: '+91',   digits: 10 },
    { iso: 'ID', flag: '🇮🇩', name: 'Indonésie',                     code: '+62',   digits: 10 },
    { iso: 'IQ', flag: '🇮🇶', name: 'Irak',                          code: '+964',  digits: 10 },
    { iso: 'IR', flag: '🇮🇷', name: 'Iran',                          code: '+98',   digits: 10 },
    { iso: 'IE', flag: '🇮🇪', name: 'Irlande',                       code: '+353',  digits: 9  },
    { iso: 'IS', flag: '🇮🇸', name: 'Islande',                       code: '+354',  digits: 7  },
    { iso: 'IL', flag: '🇮🇱', name: 'Israël',                        code: '+972',  digits: 9  },
    { iso: 'IT', flag: '🇮🇹', name: 'Italie',                        code: '+39',   digits: 10 },
    { iso: 'JM', flag: '🇯🇲', name: 'Jamaïque',                      code: '+1876', digits: 7  },
    { iso: 'JP', flag: '🇯🇵', name: 'Japon',                         code: '+81',   digits: 10 },
    { iso: 'JO', flag: '🇯🇴', name: 'Jordanie',                      code: '+962',  digits: 9  },
    { iso: 'KZ', flag: '🇰🇿', name: 'Kazakhstan',                    code: '+7',    digits: 10 },
    { iso: 'KE', flag: '🇰🇪', name: 'Kenya',                         code: '+254',  digits: 9  },
    { iso: 'KI', flag: '🇰🇮', name: 'Kiribati',                      code: '+686',  digits: 8  },
    { iso: 'KG', flag: '🇰🇬', name: 'Kirghizstan',                   code: '+996',  digits: 9  },
    { iso: 'KW', flag: '🇰🇼', name: 'Koweït',                        code: '+965',  digits: 8  },
    { iso: 'LA', flag: '🇱🇦', name: 'Laos',                          code: '+856',  digits: 9  },
    { iso: 'LS', flag: '🇱🇸', name: 'Lesotho',                       code: '+266',  digits: 8  },
    { iso: 'LV', flag: '🇱🇻', name: 'Lettonie',                      code: '+371',  digits: 8  },
    { iso: 'LB', flag: '🇱🇧', name: 'Liban',                         code: '+961',  digits: 8  },
    { iso: 'LR', flag: '🇱🇷', name: 'Liberia',                       code: '+231',  digits: 8  },
    { iso: 'LY', flag: '🇱🇾', name: 'Libye',                         code: '+218',  digits: 9  },
    { iso: 'LI', flag: '🇱🇮', name: 'Liechtenstein',                 code: '+423',  digits: 7  },
    { iso: 'LT', flag: '🇱🇹', name: 'Lituanie',                      code: '+370',  digits: 8  },
    { iso: 'LU', flag: '🇱🇺', name: 'Luxembourg',                    code: '+352',  digits: 9  },
    { iso: 'MK', flag: '🇲🇰', name: 'Macédoine du Nord',             code: '+389',  digits: 8  },
    { iso: 'MG', flag: '🇲🇬', name: 'Madagascar',                    code: '+261',  digits: 9  },
    { iso: 'MY', flag: '🇲🇾', name: 'Malaisie',                      code: '+60',   digits: 9  },
    { iso: 'MW', flag: '🇲🇼', name: 'Malawi',                        code: '+265',  digits: 9  },
    { iso: 'MV', flag: '🇲🇻', name: 'Maldives',                      code: '+960',  digits: 7  },
    { iso: 'ML', flag: '🇲🇱', name: 'Mali',                          code: '+223',  digits: 8  },
    { iso: 'MT', flag: '🇲🇹', name: 'Malte',                         code: '+356',  digits: 8  },
    { iso: 'MA', flag: '🇲🇦', name: 'Maroc',                         code: '+212',  digits: 9  },
    { iso: 'MH', flag: '🇲🇭', name: 'Îles Marshall',                 code: '+692',  digits: 7  },
    { iso: 'MU', flag: '🇲🇺', name: 'Maurice',                       code: '+230',  digits: 8  },
    { iso: 'MR', flag: '🇲🇷', name: 'Mauritanie',                    code: '+222',  digits: 8  },
    { iso: 'MX', flag: '🇲🇽', name: 'Mexique',                       code: '+52',   digits: 10 },
    { iso: 'FM', flag: '🇫🇲', name: 'Micronésie',                    code: '+691',  digits: 7  },
    { iso: 'MD', flag: '🇲🇩', name: 'Moldavie',                      code: '+373',  digits: 8  },
    { iso: 'MC', flag: '🇲🇨', name: 'Monaco',                        code: '+377',  digits: 8  },
    { iso: 'MN', flag: '🇲🇳', name: 'Mongolie',                      code: '+976',  digits: 8  },
    { iso: 'ME', flag: '🇲🇪', name: 'Monténégro',                    code: '+382',  digits: 8  },
    { iso: 'MZ', flag: '🇲🇿', name: 'Mozambique',                    code: '+258',  digits: 9  },
    { iso: 'MM', flag: '🇲🇲', name: 'Myanmar',                       code: '+95',   digits: 9  },
    { iso: 'NA', flag: '🇳🇦', name: 'Namibie',                       code: '+264',  digits: 9  },
    { iso: 'NR', flag: '🇳🇷', name: 'Nauru',                         code: '+674',  digits: 7  },
    { iso: 'NP', flag: '🇳🇵', name: 'Népal',                         code: '+977',  digits: 10 },
    { iso: 'NI', flag: '🇳🇮', name: 'Nicaragua',                     code: '+505',  digits: 8  },
    { iso: 'NE', flag: '🇳🇪', name: 'Niger',                         code: '+227',  digits: 8  },
    { iso: 'NG', flag: '🇳🇬', name: 'Nigeria',                       code: '+234',  digits: 10 },
    { iso: 'NO', flag: '🇳🇴', name: 'Norvège',                       code: '+47',   digits: 8  },
    { iso: 'NZ', flag: '🇳🇿', name: 'Nouvelle-Zélande',              code: '+64',   digits: 9  },
    { iso: 'OM', flag: '🇴🇲', name: 'Oman',                          code: '+968',  digits: 8  },
    { iso: 'UG', flag: '🇺🇬', name: 'Ouganda',                       code: '+256',  digits: 9  },
    { iso: 'UZ', flag: '🇺🇿', name: 'Ouzbékistan',                   code: '+998',  digits: 9  },
    { iso: 'PK', flag: '🇵🇰', name: 'Pakistan',                      code: '+92',   digits: 10 },
    { iso: 'PW', flag: '🇵🇼', name: 'Palaos',                        code: '+680',  digits: 7  },
    { iso: 'PS', flag: '🇵🇸', name: 'Palestine',                     code: '+970',  digits: 9  },
    { iso: 'PA', flag: '🇵🇦', name: 'Panama',                        code: '+507',  digits: 8  },
    { iso: 'PG', flag: '🇵🇬', name: 'Papouasie-Nouvelle-Guinée',     code: '+675',  digits: 8  },
    { iso: 'PY', flag: '🇵🇾', name: 'Paraguay',                      code: '+595',  digits: 9  },
    { iso: 'NL', flag: '🇳🇱', name: 'Pays-Bas',                      code: '+31',   digits: 9  },
    { iso: 'PE', flag: '🇵🇪', name: 'Pérou',                         code: '+51',   digits: 9  },
    { iso: 'PH', flag: '🇵🇭', name: 'Philippines',                   code: '+63',   digits: 10 },
    { iso: 'PL', flag: '🇵🇱', name: 'Pologne',                       code: '+48',   digits: 9  },
    { iso: 'PT', flag: '🇵🇹', name: 'Portugal',                      code: '+351',  digits: 9  },
    { iso: 'QA', flag: '🇶🇦', name: 'Qatar',                         code: '+974',  digits: 8  },
    { iso: 'CF', flag: '🇨🇫', name: 'Rép. centrafricaine',           code: '+236',  digits: 8  },
    { iso: 'DO', flag: '🇩🇴', name: 'Rép. dominicaine',              code: '+1809', digits: 7  },
    { iso: 'CZ', flag: '🇨🇿', name: 'Rép. tchèque',                  code: '+420',  digits: 9  },
    { iso: 'RO', flag: '🇷🇴', name: 'Roumanie',                      code: '+40',   digits: 9  },
    { iso: 'GB', flag: '🇬🇧', name: 'Royaume-Uni',                   code: '+44',   digits: 10 },
    { iso: 'RU', flag: '🇷🇺', name: 'Russie',                        code: '+7',    digits: 10 },
    { iso: 'RW', flag: '🇷🇼', name: 'Rwanda',                        code: '+250',  digits: 9  },
    { iso: 'KN', flag: '🇰🇳', name: 'Saint-Christophe-et-Niévès',   code: '+1869', digits: 7  },
    { iso: 'SM', flag: '🇸🇲', name: 'Saint-Marin',                   code: '+378',  digits: 8  },
    { iso: 'VC', flag: '🇻🇨', name: 'Saint-Vincent-et-Grenadines',   code: '+1784', digits: 7  },
    { iso: 'LC', flag: '🇱🇨', name: 'Sainte-Lucie',                  code: '+1758', digits: 7  },
    { iso: 'SB', flag: '🇸🇧', name: 'Îles Salomon',                  code: '+677',  digits: 7  },
    { iso: 'WS', flag: '🇼🇸', name: 'Samoa',                         code: '+685',  digits: 7  },
    { iso: 'ST', flag: '🇸🇹', name: 'Sao Tomé-et-Príncipe',          code: '+239',  digits: 7  },
    { iso: 'SN', flag: '🇸🇳', name: 'Sénégal',                       code: '+221',  digits: 9  },
    { iso: 'RS', flag: '🇷🇸', name: 'Serbie',                        code: '+381',  digits: 9  },
    { iso: 'SC', flag: '🇸🇨', name: 'Seychelles',                    code: '+248',  digits: 7  },
    { iso: 'SL', flag: '🇸🇱', name: 'Sierra Leone',                  code: '+232',  digits: 8  },
    { iso: 'SG', flag: '🇸🇬', name: 'Singapour',                     code: '+65',   digits: 8  },
    { iso: 'SK', flag: '🇸🇰', name: 'Slovaquie',                     code: '+421',  digits: 9  },
    { iso: 'SI', flag: '🇸🇮', name: 'Slovénie',                      code: '+386',  digits: 8  },
    { iso: 'SO', flag: '🇸🇴', name: 'Somalie',                       code: '+252',  digits: 8  },
    { iso: 'SD', flag: '🇸🇩', name: 'Soudan',                        code: '+249',  digits: 9  },
    { iso: 'SS', flag: '🇸🇸', name: 'Soudan du Sud',                 code: '+211',  digits: 9  },
    { iso: 'LK', flag: '🇱🇰', name: 'Sri Lanka',                     code: '+94',   digits: 9  },
    { iso: 'SE', flag: '🇸🇪', name: 'Suède',                         code: '+46',   digits: 9  },
    { iso: 'CH', flag: '🇨🇭', name: 'Suisse',                        code: '+41',   digits: 9  },
    { iso: 'SR', flag: '🇸🇷', name: 'Suriname',                      code: '+597',  digits: 7  },
    { iso: 'SY', flag: '🇸🇾', name: 'Syrie',                         code: '+963',  digits: 9  },
    { iso: 'TJ', flag: '🇹🇯', name: 'Tadjikistan',                   code: '+992',  digits: 9  },
    { iso: 'TW', flag: '🇹🇼', name: 'Taïwan',                        code: '+886',  digits: 9  },
    { iso: 'TZ', flag: '🇹🇿', name: 'Tanzanie',                      code: '+255',  digits: 9  },
    { iso: 'TD', flag: '🇹🇩', name: 'Tchad',                         code: '+235',  digits: 8  },
    { iso: 'TH', flag: '🇹🇭', name: 'Thaïlande',                     code: '+66',   digits: 9  },
    { iso: 'TL', flag: '🇹🇱', name: 'Timor oriental',                code: '+670',  digits: 8  },
    { iso: 'TG', flag: '🇹🇬', name: 'Togo',                          code: '+228',  digits: 8  },
    { iso: 'TO', flag: '🇹🇴', name: 'Tonga',                         code: '+676',  digits: 7  },
    { iso: 'TT', flag: '🇹🇹', name: 'Trinité-et-Tobago',             code: '+1868', digits: 7  },
    { iso: 'TN', flag: '🇹🇳', name: 'Tunisie',                       code: '+216',  digits: 8  },
    { iso: 'TM', flag: '🇹🇲', name: 'Turkménistan',                  code: '+993',  digits: 8  },
    { iso: 'TR', flag: '🇹🇷', name: 'Turquie',                       code: '+90',   digits: 10 },
    { iso: 'TV', flag: '🇹🇻', name: 'Tuvalu',                        code: '+688',  digits: 6  },
    { iso: 'UA', flag: '🇺🇦', name: 'Ukraine',                       code: '+380',  digits: 9  },
    { iso: 'UY', flag: '🇺🇾', name: 'Uruguay',                       code: '+598',  digits: 8  },
    { iso: 'VU', flag: '🇻🇺', name: 'Vanuatu',                       code: '+678',  digits: 7  },
    { iso: 'VA', flag: '🇻🇦', name: 'Vatican',                       code: '+379',  digits: 10 },
    { iso: 'VE', flag: '🇻🇪', name: 'Venezuela',                     code: '+58',   digits: 10 },
    { iso: 'VN', flag: '🇻🇳', name: 'Viêt Nam',                      code: '+84',   digits: 10 },
    { iso: 'YE', flag: '🇾🇪', name: 'Yémen',                         code: '+967',  digits: 9  },
    { iso: 'ZM', flag: '🇿🇲', name: 'Zambie',                        code: '+260',  digits: 9  },
    { iso: 'ZW', flag: '🇿🇼', name: 'Zimbabwe',                      code: '+263',  digits: 9  },
]

/* ── Password strength ─────────────────────────────────────────────── */
const PWD_CHECKS = [
    { label: '8 caractères minimum',       test: p => p.length >= 8           },
    { label: 'Une lettre majuscule',        test: p => /[A-Z]/.test(p)         },
    { label: 'Une lettre minuscule',        test: p => /[a-z]/.test(p)         },
    { label: 'Un chiffre',                  test: p => /[0-9]/.test(p)         },
    { label: 'Un caractère spécial (!@#…)', test: p => /[^A-Za-z0-9]/.test(p) },
]

function passwordScore(pwd) {
    return PWD_CHECKS.filter(c => c.test(pwd)).length
}

const STRENGTH = [
    { label: '',       color: '#E2E8F0', segments: 0 },
    { label: 'Faible', color: '#EF4444', segments: 1 },
    { label: 'Faible', color: '#EF4444', segments: 1 },
    { label: 'Moyen',  color: '#F59E0B', segments: 2 },
    { label: 'Bon',    color: '#3B82F6', segments: 3 },
    { label: 'Fort',   color: '#10B981', segments: 4 },
]

function PasswordStrength({ password }) {
    if (!password) return null
    const score = passwordScore(password)
    const s = STRENGTH[score]
    return (
        <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= s.segments ? s.color : '#E2E8F0', transition: 'background 0.2s' }} />
                ))}
            </div>
            {s.label && (
                <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginBottom: 8 }}>
                    Mot de passe : {s.label}
                </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {PWD_CHECKS.map((c, i) => {
                    const ok = c.test(password)
                    return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: ok ? '#ECFDF5' : '#F8FAFC', border: `1.5px solid ${ok ? '#10B981' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {ok && <Check size={8} color="#10B981" strokeWidth={3} />}
                            </div>
                            <span style={{ color: ok ? '#374151' : '#94A3B8' }}>{c.label}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/* ── Phone field ────────────────────────────────────────────────────── */
function PhoneField({ value, onChange, country, onCountryChange }) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const ref = useRef(null)

    const selected = COUNTRIES.find(c => c.iso === country) || COUNTRIES[0]
    const filtered = COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search)
    )

    useEffect(() => {
        const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleNumberInput = e => {
        const digits = e.target.value.replace(/[^\d]/g, '')
        onChange(digits)
    }

    const digitsOk = value.length === 0 || value.length === selected.digits
    const digitsHint = value.length > 0 && !digitsOk
        ? `${selected.digits} chiffres requis après ${selected.code} (${value.length}/${selected.digits})`
        : ''

    return (
        <div className="field">
            <label>Téléphone</label>
            <div ref={ref} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: 0, border: '1.5px solid #E2E8F0', borderRadius: 10, overflow: 'visible', background: '#fff' }}>
                    {/* Country selector */}
                    <button
                        type="button"
                        onClick={() => setOpen(o => !o)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '0 10px', background: '#F8FAFC',
                            border: 'none', borderRight: '1.5px solid #E2E8F0',
                            borderRadius: '8px 0 0 8px', cursor: 'pointer',
                            fontSize: 13, fontWeight: 600, color: '#374151',
                            flexShrink: 0, height: 40, whiteSpace: 'nowrap',
                        }}
                    >
                        <img src={`https://flagcdn.com/20x15/${selected.iso.toLowerCase()}.png`} width="20" height="15" alt={selected.name} style={{ borderRadius: 2, display: 'block', flexShrink: 0 }} />
                        <span style={{ color: '#64748B' }}>{selected.code}</span>
                        <ChevronDown size={13} color="#94A3B8" />
                    </button>
                    {/* Number input */}
                    <input
                        type="tel"
                        value={value}
                        onChange={handleNumberInput}
                        placeholder={`${'X'.repeat(selected.digits)}`}
                        maxLength={selected.digits}
                        style={{
                            flex: 1, border: 'none', outline: 'none',
                            padding: '0 12px', fontSize: 14, fontFamily: 'var(--mono, monospace)',
                            background: 'transparent', letterSpacing: '0.5px',
                            color: '#0F172A',
                        }}
                    />
                </div>

                {/* Dropdown */}
                {open && (
                    <div style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 999,
                        background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 12,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)', width: 280, maxHeight: 300,
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    }}>
                        <div style={{ padding: '8px 10px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Rechercher un pays…"
                                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#374151', background: 'transparent' }}
                            />
                            {search && <button type="button" onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2 }}><X size={13} color="#94A3B8" /></button>}
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {filtered.map(c => (
                                <button
                                    key={c.iso}
                                    type="button"
                                    onClick={() => { onCountryChange(c.iso); onChange(''); setOpen(false); setSearch('') }}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '9px 14px', border: 'none', cursor: 'pointer',
                                        background: c.iso === country ? '#F0F0FF' : 'transparent',
                                        fontSize: 13, color: '#0F172A', textAlign: 'left',
                                    }}
                                    onMouseEnter={e => { if (c.iso !== country) e.currentTarget.style.background = '#F8FAFC' }}
                                    onMouseLeave={e => { if (c.iso !== country) e.currentTarget.style.background = 'transparent' }}
                                >
                                    <img src={`https://flagcdn.com/20x15/${c.iso.toLowerCase()}.png`} width="20" height="15" alt={c.name} style={{ borderRadius: 2, display: 'block', flexShrink: 0 }} />
                                    <span style={{ flex: 1 }}>{c.name}</span>
                                    <span style={{ color: '#64748B', fontWeight: 600, fontSize: 12 }}>{c.code}</span>
                                    <span style={{ color: '#CBD5E1', fontSize: 11 }}>{c.digits} ch.</span>
                                </button>
                            ))}
                            {filtered.length === 0 && (
                                <div style={{ padding: '12px 14px', fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>Aucun résultat</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {digitsHint && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{digitsHint}</p>}
        </div>
    )
}

/* ── Other reusable fields ──────────────────────────────────────────── */
const WILAYAS = [
    '01 - Adrar', '02 - Chlef', '03 - Laghouat', '04 - Oum El Bouaghi', '05 - Batna',
    '06 - Béjaïa', '07 - Biskra', '08 - Béchar', '09 - Blida', '10 - Bouira',
    '11 - Tamanrasset', '12 - Tébessa', '13 - Tlemcen', '14 - Tiaret', '15 - Tizi Ouzou',
    '16 - Alger', '17 - Djelfa', '18 - Jijel', '19 - Sétif', '20 - Saïda',
    '21 - Skikda', '22 - Sidi Bel Abbès', '23 - Annaba', '24 - Guelma', '25 - Constantine',
    '26 - Médéa', '27 - Mostaganem', "28 - M'Sila", '29 - Mascara', '30 - Ouargla',
    '31 - Oran', '32 - El Bayadh', '33 - Illizi', '34 - Bordj Bou Arréridj', '35 - Boumerdès',
    '36 - El Tarf', '37 - Tindouf', '38 - Tissemsilt', '39 - El Oued', '40 - Khenchela',
    '41 - Souk Ahras', '42 - Tipaza', '43 - Mila', '44 - Aïn Defla', '45 - Naâma',
    '46 - Aïn Témouchent', '47 - Ghardaïa', '48 - Relizane', '49 - Timimoun',
    '50 - Bordj Badji Mokhtar', '51 - Ouled Djellal', '52 - Béni Abbès', '53 - In Salah',
    "54 - In Guezzam", '55 - Touggourt', '56 - Djanet', "57 - El M'Ghair", '58 - El Meniaa',
]

const DIVISIONS = {
    DZ: { label: 'Wilaya',                list: WILAYAS },
    FR: { label: 'Région',                list: ['Auvergne-Rhône-Alpes','Bourgogne-Franche-Comté','Bretagne','Centre-Val de Loire','Corse','Grand Est','Hauts-de-France','Île-de-France','Normandie','Nouvelle-Aquitaine','Occitanie','Pays de la Loire',"Provence-Alpes-Côte d'Azur",'Guadeloupe','Martinique','Guyane','La Réunion','Mayotte'] },
    MA: { label: 'Région',                list: ['Tanger-Tétouan-Al Hoceïma',"L'Oriental",'Fès-Meknès','Rabat-Salé-Kénitra','Béni Mellal-Khénifra','Casablanca-Settat','Marrakech-Safi','Drâa-Tafilalet','Souss-Massa','Guelmim-Oued Noun','Laâyoune-Sakia El Hamra','Dakhla-Oued Ed-Dahab'] },
    TN: { label: 'Gouvernorat',           list: ['Ariana','Béja','Ben Arous','Bizerte','Gabès','Gafsa','Jendouba','Kairouan','Kasserine','Kébili','Le Kef','Mahdia','La Manouba','Médenine','Monastir','Nabeul','Sfax','Sidi Bouzid','Siliana','Sousse','Tataouine','Tozeur','Tunis','Zaghouan'] },
    LY: { label: 'District',              list: ['Tripoli','Benghazi','Misrata','Zaouïa','Derna','Sirt','Sabha','Al-Kufra','Nalut','Al-Marj','Al-Jafara','Al Wahat','Al Jabal al Akhdar','Al Jabal al Gharbi','An Nuqat al Khams','Ghat','Murzuq','Wadi al Hayaa','Wadi ash Shati','Al Jufrah','Al Butnan'] },
    EG: { label: 'Gouvernorat',           list: ['Le Caire','Alexandrie','Port-Saïd','Suez','Damiette','Dakahlia','Charqia','Qalyubia','Kafr el-Cheikh','Gharbia','Menoufia','Béheira','Ismaïlia','Gizeh','Beni Suef','Fayoum','Minieh','Assiout','Sohag','Qéna','Assouan','Louxor','Mer Rouge','Nouvelle Vallée','Matruh','Sinaï du Nord','Sinaï du Sud'] },
    SA: { label: 'Région',                list: ['Riyad','Makkah al-Moukarrama','Médine','Al-Qassim','Province orientale','Assir','Tabuk','Haïl','Frontières du Nord','Jazan','Najran','Al-Baha','Al-Jouf'] },
    AE: { label: 'Émirat',                list: ['Abou Dabi','Dubaï','Charjah','Ajman','Oumm al-Qaïwaïn','Ras el Khaïmah','Foudjairah'] },
    QA: { label: 'Municipalité',          list: ['Ad-Dawhah (Doha)','Al-Khawr','Ash-Shamal','Al-Wakrah','Ar-Rayyan','Umm Salal','Al-Daayen',"Az-Za'ayin"] },
    KW: { label: 'Gouvernorat',           list: ['Al-Asimah','Hawalli','Farwaniya','Ahmadi','Jahra','Mubarak Al-Kabeer'] },
    IQ: { label: 'Gouvernorat',           list: ['Bagdad','Bassora','Ninive','Erbil','Kirkouk','Dohouk','Souleimaniye','Diwaniyah','Karbala','Nadjaf','Ammara','Samawah','Nassiriya','Hillah','Tikrit','Baquba','Ramadi','Kout','Hilla','Halabja'] },
    JO: { label: 'Gouvernorat',           list: ['Amman','Irbid','Zarqa','Al-Balqa','Mafraq','Karak','Ajloun','Jerash','Madaba','Aqaba',"Ma'an",'Tafilah'] },
    LB: { label: 'Gouvernorat',           list: ['Beyrouth','Mont-Liban','Liban-Nord','Liban-Sud','Nabatiyeh','Bekaa','Akkar','Baalbek-Hermel'] },
    SY: { label: 'Gouvernorat',           list: ['Damas','Alep','Homs','Hama','Lattaquié','Tartous','Deir ez-Zor','Al-Hasakah','Ar-Raqqa','Idlib','Daraa','Soueïda','Quneitra','Rif-Dimachq'] },
    MR: { label: 'Wilaya',                list: ['Adrar','Assaba','Brakna','Dakhlet Nouadhibou','Gorgol','Guidimakha','Hodh el Gharbi','Hodh ech Chargui','Inchiri','Nouakchott-Nord','Nouakchott-Ouest','Nouakchott-Sud','Tagant','Tiris Zemmour','Trarza'] },
    SN: { label: 'Région',                list: ['Dakar','Diourbel','Fatick','Kaffrine','Kaolack','Kédougou','Kolda','Louga','Matam','Saint-Louis','Sédhiou','Tambacounda','Thiès','Ziguinchor'] },
    ML: { label: 'Région',                list: ['Kayes','Koulikoro','Sikasso','Ségou','Mopti','Tombouctou','Gao','Kidal','Ménaka','Taoudéni','District de Bamako'] },
    NE: { label: 'Région',                list: ['Agadez','Diffa','Dosso','Maradi','Tahoua','Tillabéri','Zinder','Niamey'] },
    TD: { label: 'Province',              list: ['Batha','Borkou','Chari-Baguirmi','Ennedi-Est','Ennedi-Ouest','Guéra','Hadjer-Lamis','Kanem','Lac','Logone Occidental','Logone Oriental','Mandoul','Mayo-Kebbi Est','Mayo-Kebbi Ouest','Moyen-Chari',"N'Djamena",'Ouaddaï','Salamat','Sila','Tandjilé','Tibesti','Wadi Fira'] },
    CM: { label: 'Région',                list: ['Adamaoua','Centre','Est','Extrême-Nord','Littoral','Nord','Nord-Ouest','Ouest','Sud','Sud-Ouest'] },
    CI: { label: 'District',              list: ['Abidjan','Bas-Sassandra','Comoé','Denguélé','Gôh-Djiboua','Lacs','Lagunes','Montagnes','Sassandra-Marahoué','Savanes','Vallée du Bandama','Woroba','Yamoussoukro','Zanzan'] },
    BF: { label: 'Région',                list: ['Boucle du Mouhoun','Cascades','Centre','Centre-Est','Centre-Nord','Centre-Ouest','Centre-Sud','Est','Hauts-Bassins','Nord','Plateau-Central','Sahel','Sud-Ouest'] },
    GH: { label: 'Région',                list: ['Ahafo','Ashanti','Bono','Bono Est','Central','Eastern','Grand Accra','Nord','Nord-Est','Oti','Savana','Upper East','Upper West','Volta','Western','Western North'] },
    NG: { label: 'État',                  list: ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT (Abuja)','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nassarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'] },
    DE: { label: 'Land',                  list: ['Bade-Wurtemberg','Bavière','Berlin','Brandebourg','Brême','Hambourg','Hesse','Mecklembourg-Poméranie-Occidentale','Basse-Saxe','Rhénanie-du-Nord-Westphalie','Rhénanie-Palatinat','Sarre','Saxe','Saxe-Anhalt','Schleswig-Holstein','Thuringe'] },
    ES: { label: 'Communauté autonome',   list: ['Andalousie','Aragon','Asturies','Îles Baléares','Pays basque','Îles Canaries','Cantabrie','Castille-et-León','Castille-La Manche','Catalogne','Estrémadure','Galice','La Rioja','Communauté de Madrid','Murcie','Navarre','Communauté valencienne','Ceuta','Melilla'] },
    IT: { label: 'Région',                list: ["Vallée d'Aoste",'Piémont','Ligurie','Lombardie','Trentin-Haut-Adige','Vénétie','Frioul-Vénétie Julienne','Émilie-Romagne','Toscane','Ombrie','Marches','Latium','Abruzzes','Molise','Campanie','Pouilles','Basilicate','Calabre','Sicile','Sardaigne'] },
    BE: { label: 'Région',                list: ['Région de Bruxelles-Capitale','Région flamande','Région wallonne'] },
    CH: { label: 'Canton',                list: ['Argovie','Appenzell Rhodes-Extérieures','Appenzell Rhodes-Intérieures','Bâle-Campagne','Bâle-Ville','Berne','Fribourg','Genève','Glaris','Grisons','Jura','Lucerne','Neuchâtel','Nidwald','Obwald','Saint-Gall','Schaffhouse','Schwyz','Soleure','Tessin','Thurgovie','Uri','Valais','Vaud','Zoug','Zurich'] },
    PT: { label: 'Région',                list: ['Nord','Centre','Région métropolitaine de Lisbonne','Alentejo','Algarve','Açores','Madère'] },
    NL: { label: 'Province',              list: ['Groningue','Frise','Drenthe','Overijssel','Flevoland','Gueldre','Utrecht','Hollande-Septentrionale','Hollande-Méridionale','Zélande','Brabant-Septentrional','Limbourg'] },
    SE: { label: 'Comté',                 list: ['Blekinge','Dalarna','Gävleborg','Gotland','Halland','Jämtland','Jönköping','Kalmar','Kronoberg','Norrbotten','Örebro','Östergötland','Skåne','Södermanland','Stockholm','Uppsala','Värmland','Västerbotten','Västernorrland','Västmanland','Västra Götaland'] },
    NO: { label: 'Comté',                 list: ['Agder','Innlandet','Møre og Romsdal','Nordland','Oslo','Rogaland','Troms og Finnmark','Trøndelag','Vestfold og Telemark','Vestland','Viken'] },
    DK: { label: 'Région',                list: ['Capitale','Seeland','Danemark-Méridional','Jutland-Central','Jutland-Septentrional'] },
    FI: { label: 'Région',                list: ['Laponie','Ostrobotnie du Nord','Kainuu','Ostrobotnie du Centre','Ostrobotnie du Sud','Ostrobotnie','Satakunta','Pirkanmaa','Häme du Centre','Häme du Päijät','Tavastia du Sud','Carélique du Nord','Carélie du Sud','Savo du Nord','Savo du Sud','Îles Åland','Finlande du Sud-Ouest','Uusimaa','Kymenlaakso'] },
    PL: { label: 'Voïvodie',              list: ['Basse-Silésie','Cujavie-Poméranie','Lublin','Lubusz','Łódź','Petite-Pologne','Mazovie','Opole','Subcarpatie','Podlachie','Poméranie','Silésie','Sainte-Croix','Varmie-Mazurie','Grande-Pologne','Poméranie-Occidentale'] },
    GB: { label: 'Pays constitutif',      list: ['Angleterre','Écosse','Pays de Galles','Irlande du Nord'] },
    IE: { label: 'Comté',                 list: ['Carlow','Cavan','Clare','Cork','Donegal','Dublin','Galway','Kerry','Kildare','Kilkenny','Laois','Leitrim','Limerick','Longford','Louth','Mayo','Meath','Monaghan','Offaly','Roscommon','Sligo','Tipperary','Waterford','Westmeath','Wexford','Wicklow'] },
    US: { label: 'État',                  list: ['Alabama','Alaska','Arizona','Arkansas','Californie','Colorado','Connecticut','Delaware','Floride','Géorgie','Hawaï','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiane','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','Nouveau-Mexique','New York','Caroline du Nord','Dakota du Nord','Ohio','Oklahoma','Oregon','Pennsylvanie','Rhode Island','Caroline du Sud','Dakota du Sud','Tennessee','Texas','Utah','Vermont','Virginie','Washington','Virginie-Occidentale','Wisconsin','Wyoming','District de Columbia'] },
    CA: { label: 'Province / Territoire', list: ['Alberta','Colombie-Britannique','Île-du-Prince-Édouard','Manitoba','Nouveau-Brunswick','Nouvelle-Écosse','Nunavut','Ontario','Québec','Saskatchewan','Terre-Neuve-et-Labrador','Territoires du Nord-Ouest','Yukon'] },
    BR: { label: 'État',                  list: ['Acre','Alagoas','Amapá','Amazonas','Bahia','Ceará','District fédéral','Espírito Santo','Goiás','Maranhão','Mato Grosso','Mato Grosso do Sul','Minas Gerais','Pará','Paraíba','Paraná','Pernambuco','Piauí','Rio de Janeiro','Rio Grande do Norte','Rio Grande do Sul','Rondônia','Roraima','Santa Catarina','São Paulo','Sergipe','Tocantins'] },
    MX: { label: 'État',                  list: ['Aguascalientes','Basse-Californie','Basse-Californie du Sud','Campeche','Chiapas','Chihuahua','Coahuila','Colima','Durango','Guanajuato','Guerrero','Hidalgo','Jalisco','Mexico (État)','Mexico (Ville)','Michoacán','Morelos','Nayarit','Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo','San Luis Potosí','Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas'] },
    TR: { label: 'Province',              list: ['Adana','Adıyaman','Afyonkarahisar','Ağrı','Aksaray','Amasya','Ankara','Antalya','Ardahan','Artvin','Aydın','Balıkesir','Bartın','Batman','Bayburt','Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale','Çankırı','Çorum','Denizli','Diyarbakır','Düzce','Edirne','Elazığ','Erzincan','Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari','Hatay','Iğdır','Isparta','İstanbul','İzmir','Kahramanmaraş','Karabük','Karaman','Kars','Kastamonu','Kayseri','Kırıkkale','Kırklareli','Kırşehir','Kilis','Kocaeli','Konya','Kütahya','Malatya','Manisa','Mardin','Mersin','Muğla','Muş','Nevşehir','Niğde','Ordu','Osmaniye','Rize','Sakarya','Samsun','Siirt','Sinop','Sivas','Şanlıurfa','Şırnak','Tekirdağ','Tokat','Trabzon','Tunceli','Uşak','Van','Yalova','Yozgat','Zonguldak'] },
    RU: { label: 'Région',                list: ['Moscou','Saint-Pétersbourg','Novosibirsk','Ekaterinbourg','Nijni Novgorod','Kazan','Tcheliabinsk','Omsk','Samara','Rostov-sur-le-Don','Oufa','Krasnodar','Voronej','Perm','Volgograd','Saratov','Krasnoïarsk','Tioumen','Irkoutsk','Rép. du Tatarstan','Bachkirie','Région de Moscou','Oblast de Léningrad'] },
    CN: { label: 'Province',              list: ['Anhui','Fujian','Gansu','Guangdong','Guizhou','Hainan','Hebei','Heilongjiang','Henan','Hubei','Hunan','Jiangsu','Jiangxi','Jilin','Liaoning','Qinghai','Shaanxi','Shandong','Shanxi','Sichuan','Yunnan','Zhejiang','Mongolie-Intérieure','Guangxi','Ningxia','Tibet','Xinjiang','Beijing','Chongqing','Shanghai','Tianjin','Hong Kong','Macao'] },
    IN: { label: 'État',                  list: ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','Bengale-Occidental','Delhi','Jammu-et-Cachemire'] },
    AU: { label: 'État / Territoire',     list: ['Nouvelle-Galles du Sud','Victoria','Queensland','Australie-Méridionale','Australie-Occidentale','Tasmanie','Territoire de la capitale australienne','Territoire du Nord'] },
    JP: { label: 'Préfecture',            list: ['Aichi','Akita','Aomori','Chiba','Ehime','Fukui','Fukuoka','Fukushima','Gifu','Gunma','Hiroshima','Hokkaido','Hyogo','Ibaraki','Ishikawa','Iwate','Kagawa','Kagoshima','Kanagawa','Kochi','Kumamoto','Kyoto','Mie','Miyagi','Miyazaki','Nagano','Nagasaki','Nara','Niigata','Oita','Okayama','Okinawa','Osaka','Saga','Saitama','Shiga','Shimane','Shizuoka','Tochigi','Tokushima','Tokyo','Tottori','Toyama','Wakayama','Yamagata','Yamaguchi','Yamanashi'] },
    KR: { label: 'Province',              list: ['Séoul','Busan','Daegu','Incheon','Gwangju','Daejeon','Ulsan','Sejong','Gyeonggi','Gangwon','Chungcheong-Nord','Chungcheong-Sud','Jeolla-Nord','Jeolla-Sud','Gyeongsang-Nord','Gyeongsang-Sud','Jeju'] },
    ZA: { label: 'Province',              list: ['Le Cap','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','Cap-du-Nord','État-Libre','Nord-Ouest','Cap-Occidental'] },
}

function getDivisionInfo(iso) {
    return DIVISIONS[iso] || null
}

const PLANS = [
    {
        key: 'SOLO', label: 'Solo', prix: 4900, color: 'var(--indigo)', bg: '#EEEEFE',
        features: ['1 architecte', '5 GB de stockage', 'Projets illimités', 'Factures + Devis PDF', 'Journal de chantier', 'Documents & Photos'],
    },
    {
        key: 'CABINET', label: 'Cabinet', prix: 8900, color: '#10B981', bg: '#ECFDF5', popular: true,
        features: ['3 architectes', '10 GB de stockage', 'Tout Solo inclus', 'Planning équipe', 'Feuilles de temps', 'Rentabilité par projet'],
    },
    {
        key: 'AGENCE', label: 'Agence', prix: 14900, color: '#8B5CF6', bg: '#F5F3FF',
        features: ['5 architectes', '15 GB de stockage', 'Tout Cabinet inclus', 'Export comptable', 'Support 7j/7', 'Onboarding inclus'],
    },
]

const STEPS = [
    { num: 1, label: 'Créer votre compte' },
    { num: 2, label: 'Informations cabinet' },
    { num: 3, label: 'Choisir et payer' },
]

const EMPTY_FORM = {
    prenom: '', nom: '', email: '', password: '', confirm: '',
    nom_cabinet: '', telephone: '', wilaya: '', adresse: '',
}

const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
)

function Field({ label, k, type = 'text', form, update, placeholder = '' }) {
    return (
        <div className="field">
            <label>{label}</label>
            <input type={type} value={form[k]} placeholder={placeholder} onChange={e => update(k, e.target.value)} />
        </div>
    )
}

function PwdField({ label, k, show, setShow, form, update, showStrength = false }) {
    return (
        <div className="field">
            <label>{label}</label>
            <div className="auth-pwd-wrap">
                <input
                    type={show ? 'text' : 'password'}
                    value={form[k]}
                    onChange={e => update(k, e.target.value)}
                    style={{ paddingRight: 44 }}
                />
                <button type="button" className="auth-pwd-toggle" onClick={() => setShow(s => !s)}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
            {showStrength && <PasswordStrength password={form[k]} />}
        </div>
    )
}

/* ── Main component ─────────────────────────────────────────────────── */
export default function Register() {
    const navigate = useNavigate()
    const location = useLocation()
    const { setUser, setToken } = useStore()
    const [step, setStep] = useState(1)
    const [plan, setPlan] = useState('CABINET')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [gLoading, setGLoading] = useState(false)
    const [showPwd, setShowPwd] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)
    const [googleToken, setGoogleToken] = useState(null)
    const [phoneCountry, setPhoneCountry] = useState('DZ')

    const handleCountryChange = (iso) => {
        setPhoneCountry(iso)
        update('wilaya', '')
    }

    useEffect(() => {
        const state = location.state
        if (state?.google && state?.accessToken) {
            setGoogleToken(state.accessToken)
            setForm(f => ({ ...f, prenom: state.google.prenom || '', nom: state.google.nom || '', email: state.google.email || '' }))
            setStep(2)
        }
    }, [location.state])

    const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

    const handleStep1 = () => {
        if (!form.prenom || !form.nom || !form.email || !form.password) {
            setError('Tous les champs sont obligatoires'); return
        }
        if (!EMAIL_REGEX.test(form.email)) {
            setError('Adresse email invalide'); return
        }
        if (passwordScore(form.password) < 3) {
            setError('Mot de passe trop faible — ajoutez majuscules, chiffres ou caractères spéciaux'); return
        }
        if (form.password !== form.confirm) {
            setError('Les mots de passe ne correspondent pas'); return
        }
        setError('')
        setStep(2)
    }

    const handleStep2 = () => {
        if (!form.nom_cabinet) { setError('Le nom du cabinet est obligatoire'); return }
        if (form.telephone) {
            const country = COUNTRIES.find(c => c.iso === phoneCountry) || COUNTRIES[0]
            if (form.telephone.length !== country.digits) {
                setError(`Numéro invalide : ${country.digits} chiffres requis après ${country.code}`); return
            }
        }
        setError('')
        setStep(3)
    }

    const googleRegister = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            setGLoading(true)
            api.post('/users/google-auth/', { access_token: tokenResponse.access_token })
                .then(res => {
                    if (res.status === 202) {
                        setGoogleToken(tokenResponse.access_token)
                        setForm(f => ({ ...f, prenom: res.data.prenom || '', nom: res.data.nom || '', email: res.data.email || '' }))
                        setError('')
                        setStep(2)
                    } else {
                        setToken(res.data.access)
                        setUser(res.data.user)
                        navigate('/dashboard')
                    }
                })
                .catch(() => setError('Erreur connexion Google'))
                .finally(() => setGLoading(false))
        },
        onError: () => setError('Connexion Google annulée'),
    })

    const handleSubmit = async () => {
        setLoading(true)
        setError('')
        try {
            const country = COUNTRIES.find(c => c.iso === phoneCountry) || COUNTRIES[0]
            const fullPhone = form.telephone ? `${country.code}${form.telephone}` : ''

            let access, user
            if (googleToken) {
                const res = await api.post('/users/google-auth/', {
                    access_token: googleToken, plan, nom_cabinet: form.nom_cabinet,
                })
                access = res.data.access
                user = res.data.user
            } else {
                const res = await api.post('/users/register/', {
                    prenom: form.prenom, nom: form.nom, email: form.email,
                    password: form.password, plan, nom_cabinet: form.nom_cabinet,
                    telephone: fullPhone || undefined,
                })
                access = res.data.access
                user = res.data.user
            }

            const checkout = await api.post('/finances/checkout/', { plan }, {
                headers: { Authorization: `Bearer ${access}` }
            })

            sessionStorage.setItem('pending_token', access)
            sessionStorage.setItem('pending_user', JSON.stringify(user))
            window.location.href = checkout.data.checkout_url

        } catch (err) {
            const d = err.response?.data
            setError(d?.email?.[0] ?? d?.error ?? d?.detail ?? "Erreur lors de l'inscription")
            setLoading(false)
        }
    }

    const planInfo = PLANS.find(p => p.key === plan)

    return (
        <div className="auth-layout">
            <div className="auth-left">
                <div className="auth-left-inner">
                    <div style={{ margin: '0 auto 24px', display: 'flex', justifyContent: 'center' }}>
                        <PlannerMark size={72} />
                    </div>
                    <h1 className="auth-logo-title">Planner</h1>
                    <p className="auth-logo-sub">La plateforme de gestion pour les cabinets d'architecture algériens</p>
                    <div className="flex-col gap-8" style={{ textAlign: 'left' }}>
                        {STEPS.map(s => {
                            const done = step > s.num
                            const active = step === s.num
                            return (
                                <div key={s.num} className="auth-step-item">
                                    <div className={`auth-step-num ${done ? 'done' : active ? 'active' : 'idle'}`}>
                                        {done ? <Check size={14} color="white" /> : <span>{s.num}</span>}
                                    </div>
                                    <span className={`auth-step-label ${active ? 'active' : 'idle'}`}>{s.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="auth-form-wrap auth-right-lg">
                <div className="auth-form" style={{ maxWidth: 440 }}>

                {/* STEP 1 — Compte */}
                {step === 1 && (
                    <div>
                        <h2 className="auth-title-sm">Créez votre compte</h2>
                        <p className="auth-sub-sm">Rejoignez des centaines de cabinets algériens</p>

                        <button className="btn-google" onClick={() => googleRegister()} disabled={gLoading}>
                            <GoogleIcon />
                            {gLoading ? 'Connexion...' : 'Continuer avec Google'}
                        </button>
                        <div className="auth-divider">ou remplir manuellement</div>

                        {error && <div className="auth-error">{error}</div>}
                        <div className="auth-fields-card">
                            <div className="grid-2" style={{ gap: 12 }}>
                                <Field label="Prénom" k="prenom" form={form} update={update} />
                                <Field label="Nom" k="nom" form={form} update={update} />
                            </div>
                            <Field label="Email" k="email" type="email" form={form} update={update} />
                            <PwdField
                                label="Mot de passe"
                                k="password"
                                show={showPwd}
                                setShow={setShowPwd}
                                form={form}
                                update={update}
                                showStrength
                            />
                            <PwdField
                                label="Confirmer le mot de passe"
                                k="confirm"
                                show={showConfirm}
                                setShow={setShowConfirm}
                                form={form}
                                update={update}
                            />
                            {form.confirm && form.password !== form.confirm && (
                                <p style={{ fontSize: 12, color: '#EF4444', marginTop: -8 }}>Les mots de passe ne correspondent pas</p>
                            )}
                        </div>
                        <button className="btn-auth" onClick={handleStep1}>Continuer</button>
                        <p className="auth-footer">
                            Déjà un compte ? <span className="auth-link" onClick={() => navigate('/login')}>Se connecter</span>
                        </p>
                    </div>
                )}

                {/* STEP 2 — Cabinet */}
                {step === 2 && (
                    <div>
                        <h2 className="auth-title-sm">Votre cabinet</h2>
                        <p className="auth-sub-sm">Ces informations apparaîtront sur vos factures</p>
                        {error && <div className="auth-error">{error}</div>}
                        <div className="auth-fields-card">
                            <Field label="Nom du cabinet *" k="nom_cabinet" form={form} update={update} />
                            <PhoneField
                                value={form.telephone}
                                onChange={v => update('telephone', v)}
                                country={phoneCountry}
                                onCountryChange={handleCountryChange}
                            />
                            {(() => {
                                const div = getDivisionInfo(phoneCountry)
                                const divLabel = div?.label ?? 'Région / Province'
                                const divList = div?.list ?? null
                                return (
                                    <div className="field">
                                        <label>{divLabel}</label>
                                        {divList ? (
                                            <select value={form.wilaya} onChange={e => update('wilaya', e.target.value)}>
                                                <option value="">Sélectionner une {divLabel.toLowerCase()}</option>
                                                {divList.map(w => <option key={w} value={w}>{w}</option>)}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={form.wilaya}
                                                onChange={e => update('wilaya', e.target.value)}
                                                placeholder={`Entrez votre ${divLabel.toLowerCase()}`}
                                            />
                                        )}
                                    </div>
                                )
                            })()}
                            <Field label="Adresse" k="adresse" form={form} update={update} />
                        </div>
                        <div className="flex gap-12" style={{ marginTop: 0 }}>
                            <button className="btn-back" onClick={() => setStep(1)}>Retour</button>
                            <button className="btn accent" onClick={handleStep2}>Continuer</button>
                        </div>
                    </div>
                )}

                {/* STEP 3 — Plan + Paiement */}
                {step === 3 && (
                    <div>
                        <h2 className="auth-title-sm">Choisissez votre plan</h2>
                        <p className="auth-sub-sm">Changeable à tout moment</p>

                        <div className="flex-col gap-10 mb-16">
                            {PLANS.map(p => (
                                <div key={p.key}
                                    onClick={() => setPlan(p.key)}
                                    style={{
                                        border: plan === p.key ? `2px solid ${p.color}` : '1.5px solid #E2E8F0',
                                        background: plan === p.key ? p.bg : '#fff',
                                        borderRadius: 14, padding: '14px 16px', cursor: 'pointer', position: 'relative',
                                    }}>
                                    {p.popular && (
                                        <div style={{ position: 'absolute', top: -10, right: 14, background: p.color, color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 10px', borderRadius: 20, letterSpacing: 0.5 }}>POPULAIRE</div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${plan === p.key ? p.color : '#CBD5E1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {plan === p.key && <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />}
                                            </div>
                                            <span style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>{p.label}</span>
                                        </div>
                                        <span style={{ fontWeight: 800, fontSize: 15, color: p.color }}>{p.prix.toLocaleString()} DA<span style={{ fontSize: 11, fontWeight: 500, color: '#94A3B8' }}>/mois</span></span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', paddingLeft: 30 }}>
                                        {p.features.map(f => (
                                            <span key={f} style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Check size={9} color={p.color} /> {f}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {error && <div className="auth-error">{error}</div>}

                        <div style={{ background: planInfo.bg, borderRadius: 12, padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, color: '#64748B' }}>Total</span>
                            <span style={{ fontSize: 18, fontWeight: 900, color: planInfo.color }}>{planInfo.prix.toLocaleString()} DA</span>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            style={{
                                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                                background: loading ? '#E2E8F0' : `linear-gradient(135deg, ${planInfo.color}, ${planInfo.color}cc)`,
                                color: loading ? '#94A3B8' : '#fff',
                                fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
                                fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: loading ? 'none' : `0 4px 14px ${planInfo.color}44`,
                            }}
                        >
                            {loading ? 'Création du compte...' : <><CreditCard size={16} /> Créer mon compte et payer {planInfo.prix.toLocaleString()} DA <ArrowRight size={14} /></>}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, fontSize: 11, color: '#94A3B8' }}>
                            <Shield size={11} /> Paiement sécurisé via Chargily Pay
                        </div>

                        <div style={{ marginTop: 10, textAlign: 'center' }}>
                            <button className="btn-back" onClick={() => setStep(2)} style={{ display: 'inline-block' }}>Retour</button>
                        </div>
                    </div>
                )}

                </div>
            </div>
        </div>
    )
}
