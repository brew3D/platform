'use client';

import { useEffect, useRef } from 'react';
import styles from './ChemistryLoader.module.css';

export default function ChemistryLoader({ isLoading = true }) {
  const containerRef = useRef(null);
  const moleculeRef = useRef(null);
  const electronRef = useRef(null);
  const atomRefs = useRef([]);

  useEffect(() => {
    if (!isLoading) return;

    const container = containerRef.current;
    const molecule = moleculeRef.current;
    const electron = electronRef.current;

    if (!container || !molecule || !electron) return;

    // Create floating atoms
    const createFloatingAtom = () => {
      const atom = document.createElement('div');
      atom.className = styles.floatingAtom;
      atom.style.left = Math.random() * 100 + '%';
      atom.style.animationDelay = Math.random() * 2 + 's';
      atom.style.animationDuration = (Math.random() * 3 + 2) + 's';
      container.appendChild(atom);

      setTimeout(() => {
        if (atom.parentNode) {
          atom.parentNode.removeChild(atom);
        }
      }, 5000);
    };

    // Create periodic atoms
    const interval = setInterval(createFloatingAtom, 800);

    // Molecule rotation
    const rotateMolecule = () => {
      if (molecule) {
        molecule.style.transform = `rotate(${Date.now() * 0.1}deg)`;
      }
    };

    const rotationInterval = setInterval(rotateMolecule, 50);

    // Electron orbit
    const orbitElectron = () => {
      if (electron) {
        const time = Date.now() * 0.003;
        const radius = 60;
        const x = Math.cos(time) * radius;
        const y = Math.sin(time) * radius;
        electron.style.transform = `translate(${x}px, ${y}px)`;
      }
    };

    const electronInterval = setInterval(orbitElectron, 16);

    return () => {
      clearInterval(interval);
      clearInterval(rotationInterval);
      clearInterval(electronInterval);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className={styles.loaderOverlay}>
      <div className={styles.loaderContainer} ref={containerRef}>
        {/* Main Chemistry Structure */}
        <div className={styles.chemistryLab}>
          {/* Central Molecule */}
          <div className={styles.molecule} ref={moleculeRef}>
            {/* Central Atom */}
            <div className={styles.centralAtom}>
              <div className={styles.atomCore}></div>
              <div className={styles.atomGlow}></div>
            </div>
            
            {/* Orbiting Atoms */}
            <div className={styles.orbitingAtom} style={{ '--angle': '0deg' }}>
              <div className={styles.atomCore}></div>
            </div>
            <div className={styles.orbitingAtom} style={{ '--angle': '120deg' }}>
              <div className={styles.atomCore}></div>
            </div>
            <div className={styles.orbitingAtom} style={{ '--angle': '240deg' }}>
              <div className={styles.atomCore}></div>
            </div>
            
            {/* Electron */}
            <div className={styles.electron} ref={electronRef}></div>
          </div>

          {/* Chemical Bonds */}
          <div className={styles.bond} style={{ '--angle': '0deg' }}></div>
          <div className={styles.bond} style={{ '--angle': '120deg' }}></div>
          <div className={styles.bond} style={{ '--angle': '240deg' }}></div>

          {/* Lab Equipment */}
          <div className={styles.beaker}>
            <div className={styles.beakerLiquid}></div>
            <div className={styles.beakerBubbles}>
              <div className={styles.bubble}></div>
              <div className={styles.bubble}></div>
              <div className={styles.bubble}></div>
            </div>
          </div>

          <div className={styles.testTube}>
            <div className={styles.testTubeLiquid}></div>
          </div>

          {/* Periodic Table Elements */}
          <div className={styles.periodicElement} style={{ '--delay': '0s' }}>H</div>
          <div className={styles.periodicElement} style={{ '--delay': '0.2s' }}>C</div>
          <div className={styles.periodicElement} style={{ '--delay': '0.4s' }}>N</div>
          <div className={styles.periodicElement} style={{ '--delay': '0.6s' }}>O</div>
          <div className={styles.periodicElement} style={{ '--delay': '0.8s' }}>P</div>
          <div className={styles.periodicElement} style={{ '--delay': '1s' }}>S</div>

          {/* Chemical Formulas */}
          <div className={styles.formula}>H₂O</div>
          <div className={styles.formula}>CO₂</div>
          <div className={styles.formula}>CH₄</div>

          {/* Energy Waves */}
          <div className={styles.energyWave}></div>
          <div className={styles.energyWave} style={{ '--delay': '0.5s' }}></div>
          <div className={styles.energyWave} style={{ '--delay': '1s' }}></div>
        </div>

        {/* Loading Text */}
        <div className={styles.loadingText}>
          <span className={styles.loadingTitle}>Initializing AI Chemistry Lab</span>
          <div className={styles.loadingDots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill}></div>
          </div>
          <div className={styles.progressText}>Synthesizing 3D molecules...</div>
        </div>
      </div>
    </div>
  );
}
