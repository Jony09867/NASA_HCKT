import '../../data.js';
import '../shell';
import { magnetizeAllPageButtons } from '../components/Magnet';
import { glassifyAllPageButtons } from '../components/GlassSurface';

document.addEventListener('DOMContentLoaded', () => {
  magnetizeAllPageButtons();
  glassifyAllPageButtons();
});

magnetizeAllPageButtons();
glassifyAllPageButtons();
