'use client';

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

// Game configuration
const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'phaser-game',
  backgroundColor: '#2c3e50',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [MapScene, QuestScene],
};

// Map Scene - NYC-themed interactive game world
class MapScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private questZones!: Phaser.Physics.Arcade.Group;
  private buildings!: Phaser.Physics.Arcade.StaticGroup;
  private landmarks!: Phaser.Physics.Arcade.Group;
  private ui!: {
    scoreText: Phaser.GameObjects.Text;
    levelText: Phaser.GameObjects.Text;
    questsText: Phaser.GameObjects.Text;
    locationText: Phaser.GameObjects.Text;
  };
  private currentNeighborhood: string = 'Manhattan';
  private gameData = {
    score: 0,
    level: 1,
    completedQuests: 0,
    activeQuests: [],
  };

  constructor() {
    super({ key: 'MapScene' });
  }

  preload() {
    // Create NYC-themed sprites
    
    // Player (New Yorker)
    this.add.graphics()
      .fillStyle(0x3498db)
      .fillRect(0, 0, 32, 48)
      .generateTexture('player', 32, 48);

    // NYC Buildings - Different heights and colors
    this.add.graphics()
      .fillStyle(0x5d6d7e)
      .fillRect(0, 0, 80, 120)
      .generateTexture('skyscraper', 80, 120);
      
    this.add.graphics()
      .fillStyle(0x8b4513)
      .fillRect(0, 0, 60, 80)
      .generateTexture('brownstone', 60, 80);
      
    this.add.graphics()
      .fillStyle(0x708090)
      .fillRect(0, 0, 100, 150)
      .generateTexture('office-tower', 100, 150);

    // NYC Landmarks
    this.add.graphics()
      .fillStyle(0x32cd32)
      .fillRect(0, 0, 150, 100)
      .generateTexture('central-park', 150, 100);
      
    this.add.graphics()
      .fillStyle(0xff6b6b)
      .fillRect(0, 0, 40, 80)
      .generateTexture('fire-hydrant', 40, 80);
      
    this.add.graphics()
      .fillStyle(0xffd700)
      .fillRect(0, 0, 60, 60)
      .generateTexture('taxi', 60, 60);

    // Impact Quest Zones - NYC themed
    this.add.graphics()
      .fillStyle(0x2ecc71)
      .fillRect(0, 0, 70, 70)
      .generateTexture('community-center', 70, 70);
      
    this.add.graphics()
      .fillStyle(0xe74c3c)
      .fillRect(0, 0, 70, 70)
      .generateTexture('food-bank', 70, 70);
      
    this.add.graphics()
      .fillStyle(0x9b59b6)
      .fillRect(0, 0, 70, 70)
      .generateTexture('tech-hub', 70, 70);
      
    this.add.graphics()
      .fillStyle(0xf39c12)
      .fillRect(0, 0, 70, 70)
      .generateTexture('health-clinic', 70, 70);

    // Street elements
    this.add.graphics()
      .fillStyle(0x696969)
      .fillRect(0, 0, 800, 20)
      .generateTexture('street-horizontal', 800, 20);
      
    this.add.graphics()
      .fillStyle(0x696969)
      .fillRect(0, 0, 20, 600)
      .generateTexture('street-vertical', 20, 600);
      
    this.add.graphics()
      .fillStyle(0x228b22)
      .fillRect(0, 0, 40, 40)
      .generateTexture('street-tree', 40, 40);
  }

  create() {
    // Create NYC cityscape background
    this.add.rectangle(400, 300, 800, 600, 0x87ceeb, 1); // Sky blue background

    // Build NYC street grid and environment
    this.createNYCStreets();
    this.createNYCBuildings();
    this.createNYCLandmarks();

    // Create player (New Yorker)
    this.player = this.physics.add.sprite(100, 500, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(150, 150);
    this.player.setDepth(10); // Ensure player is above streets

    // Create physics groups
    this.questZones = this.physics.add.group();
    this.buildings = this.physics.add.staticGroup();
    this.landmarks = this.physics.add.group();

    // Create NYC-themed quest zones
    this.createNYCQuestZones();

    // Set up input
    this.cursors = this.input.keyboard!.createCursorKeys();
    const wasd = this.input.keyboard!.addKeys('W,S,A,D') as any;
    this.cursors = { ...this.cursors, ...wasd };

    // Create UI
    this.createUI();

    // Set up collisions
    this.physics.add.overlap(
      this.player,
      this.questZones,
      this.handleQuestZoneInteraction,
      undefined,
      this
    );

    // Add building collisions
    this.physics.add.collider(this.player, this.buildings);

    // Add click to move
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.movePlayerTo(pointer.x, pointer.y);
    });

    // Load user data
    this.loadUserData();

    // Add neighborhood detection
    this.updateNeighborhood();
  }

  update() {
    // Player movement
    const speed = 160;

    if (this.cursors.left?.isDown || this.cursors.A?.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right?.isDown || this.cursors.D?.isDown) {
      this.player.setVelocityX(speed);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up?.isDown || this.cursors.W?.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down?.isDown || this.cursors.S?.isDown) {
      this.player.setVelocityY(speed);
    } else {
      this.player.setVelocityY(0);
    }

    // Simple animation based on movement
    if (this.player.body!.velocity.x !== 0 || this.player.body!.velocity.y !== 0) {
      this.player.setTint(0x74b9ff); // Moving tint
    } else {
      this.player.setTint(0x3498db); // Idle tint
    }

    // Update neighborhood tracking
    this.updateNeighborhood();
  }

  private createNYCStreets() {
    // Create NYC street grid pattern
    // Horizontal streets (like 42nd Street, Broadway)
    const horizontalStreets = [140, 280, 420, 560];
    horizontalStreets.forEach(y => {
      const street = this.add.image(400, y, 'street-horizontal');
      street.setDepth(1);
    });

    // Vertical avenues (like 5th Avenue, Park Avenue)
    const verticalAvenues = [160, 320, 480, 640];
    verticalAvenues.forEach(x => {
      const avenue = this.add.image(x, 300, 'street-vertical');
      avenue.setDepth(1);
    });

    // Add street trees along avenues
    const treePositions = [
      { x: 140, y: 160 }, { x: 140, y: 240 }, { x: 140, y: 360 }, { x: 140, y: 480 },
      { x: 300, y: 160 }, { x: 300, y: 240 }, { x: 300, y: 360 }, { x: 300, y: 480 },
      { x: 500, y: 160 }, { x: 500, y: 240 }, { x: 500, y: 360 }, { x: 500, y: 480 },
    ];
    
    treePositions.forEach(pos => {
      const tree = this.add.image(pos.x, pos.y, 'street-tree');
      tree.setDepth(2);
    });
  }

  private createNYCBuildings() {
    // Manhattan-style skyscrapers and buildings
    const buildingData = [
      { x: 80, y: 100, type: 'skyscraper', name: 'Financial District' },
      { x: 240, y: 80, type: 'office-tower', name: 'Midtown' },
      { x: 560, y: 90, type: 'skyscraper', name: 'Upper East Side' },
      { x: 720, y: 110, type: 'office-tower', name: 'Times Square Area' },
      
      // Brownstones in residential areas
      { x: 80, y: 350, type: 'brownstone', name: 'Greenwich Village' },
      { x: 180, y: 380, type: 'brownstone', name: 'SoHo' },
      { x: 620, y: 340, type: 'brownstone', name: 'Upper West Side' },
      { x: 720, y: 370, type: 'brownstone', name: 'Chelsea' },
    ];

    buildingData.forEach(building => {
      const buildingSprite = this.add.image(building.x, building.y, building.type);
      buildingSprite.setDepth(3);
      
      // Add building to collision group
      this.buildings.add(
        this.physics.add.sprite(building.x, building.y, building.type)
          .setImmovable(true)
          .setDepth(3)
      );

      // Add building name labels
      this.add.text(building.x, building.y + 60, building.name, {
        fontSize: '10px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 3, y: 2 }
      }).setOrigin(0.5).setDepth(4);
    });
  }

  private createNYCLandmarks() {
    // Iconic NYC landmarks
    const landmarks = [
      { x: 400, y: 200, type: 'central-park', name: 'Central Park', interactive: true },
      { x: 150, y: 480, type: 'fire-hydrant', name: 'Fire Hydrant' },
      { x: 350, y: 520, type: 'taxi', name: 'NYC Taxi' },
      { x: 550, y: 480, type: 'fire-hydrant', name: 'Fire Hydrant' },
      { x: 650, y: 520, type: 'taxi', name: 'NYC Taxi' },
    ];

    landmarks.forEach(landmark => {
      const sprite = this.add.image(landmark.x, landmark.y, landmark.type);
      sprite.setDepth(3);
      
      if (landmark.interactive) {
        sprite.setInteractive();
        sprite.on('pointerdown', () => {
          this.showLandmarkInfo(landmark.name);
        });
        
        // Add pulsing effect for interactive landmarks
        this.tweens.add({
          targets: sprite,
          scale: { from: 1, to: 1.05 },
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      // Add landmark labels
      if (landmark.name !== 'Fire Hydrant') {
        this.add.text(landmark.x, landmark.y + 40, landmark.name, {
          fontSize: '10px',
          color: '#ffffff',
          backgroundColor: '#1e3a8a',
          padding: { x: 3, y: 2 }
        }).setOrigin(0.5).setDepth(4);
      }
    });
  }

  private createNYCQuestZones() {
    const nycQuestData = [
      {
        x: 200, y: 180,
        title: 'Harlem Community Center',
        description: 'Volunteer at local community center',
        points: 200,
        type: 'community',
        sprite: 'community-center',
        neighborhood: 'Harlem',
        address: '125th Street & Lenox Ave'
      },
      {
        x: 420, y: 320,
        title: 'Brooklyn Food Bank',
        description: 'Help distribute meals to families in need',
        points: 250,
        type: 'social',
        sprite: 'food-bank',
        neighborhood: 'Brooklyn',
        address: 'Flatbush Avenue'
      },
      {
        x: 580, y: 200,
        title: 'Manhattan Tech Hub',
        description: 'Teach coding to underserved youth',
        points: 300,
        type: 'tech',
        sprite: 'tech-hub',
        neighborhood: 'East Village',
        address: 'St. Marks Place'
      },
      {
        x: 300, y: 450,
        title: 'Bronx Health Clinic',
        description: 'Assist with health screenings',
        points: 200,
        type: 'health',
        sprite: 'health-clinic',
        neighborhood: 'South Bronx',
        address: 'Grand Concourse'
      },
      {
        x: 650, y: 380,
        title: 'Queens Environmental Project',
        description: 'Join urban gardening initiative',
        points: 175,
        type: 'environmental',
        sprite: 'community-center',
        neighborhood: 'Astoria',
        address: '30th Avenue'
      },
      {
        x: 120, y: 250,
        title: 'Financial District Relief',
        description: 'Support hurricane recovery efforts',
        points: 400,
        type: 'disaster_relief',
        sprite: 'community-center',
        neighborhood: 'Financial District',
        address: 'Wall Street Area'
      }
    ];

    nycQuestData.forEach((quest, index) => {
      const zone = this.physics.add.sprite(quest.x, quest.y, quest.sprite);
      zone.setData('questData', quest);
      zone.setData('questId', index);
      zone.setDepth(5);
      
      // Add pulsing animation with different colors based on type
      const pulseColor = quest.type === 'community' ? 0x2ecc71 :
                        quest.type === 'health' ? 0xe74c3c :
                        quest.type === 'tech' ? 0x9b59b6 :
                        quest.type === 'environmental' ? 0x27ae60 :
                        quest.type === 'social' ? 0xf39c12 : 0xe67e22;
      
      this.tweens.add({
        targets: zone,
        scale: { from: 1, to: 1.15 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Add quest label with NYC address
      const label = this.add.text(quest.x, quest.y + 50, quest.title, {
        fontSize: '11px',
        color: '#ffffff',
        backgroundColor: '#1a1a1a',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5).setDepth(6);

      // Add neighborhood indicator
      const neighborhoodLabel = this.add.text(quest.x, quest.y + 65, quest.neighborhood, {
        fontSize: '9px',
        color: '#ffd700',
        backgroundColor: '#000000',
        padding: { x: 3, y: 1 }
      }).setOrigin(0.5).setDepth(6);

      this.questZones.add(zone);
    });
  }

  private createUI() {
    // Create semi-transparent UI background
    const uiBackground = this.add.rectangle(10, 10, 220, 140, 0x1a1a1a, 0.9);
    uiBackground.setOrigin(0, 0).setDepth(20);

    this.ui = {
      scoreText: this.add.text(20, 25, `Impact Points: ${this.gameData.score}`, {
        fontSize: '14px',
        color: '#ffd700'
      }).setDepth(21),
      levelText: this.add.text(20, 45, `Level: ${this.gameData.level}`, {
        fontSize: '14px',
        color: '#00ff00'
      }).setDepth(21),
      questsText: this.add.text(20, 65, `Completed: ${this.gameData.completedQuests}`, {
        fontSize: '14px',
        color: '#87ceeb'
      }).setDepth(21),
      locationText: this.add.text(20, 85, `Location: ${this.currentNeighborhood}`, {
        fontSize: '14px',
        color: '#ff6b6b'
      }).setDepth(21),
    };

    // Add NYC-themed title
    this.add.text(20, 5, '🏙️ NYC Impact Game', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setDepth(21);

    // Instructions with NYC context
    this.add.text(400, 580, 'Navigate NYC streets with WASD/arrows • Click impact zones to help communities', {
      fontSize: '13px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 3 }
    }).setOrigin(0.5).setDepth(20);

    // Add mini-map legend
    this.add.text(780, 20, 'LEGEND', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(20);

    const legendItems = [
      { color: '#2ecc71', text: '🏢 Community' },
      { color: '#e74c3c', text: '🍽️ Food Bank' },
      { color: '#9b59b6', text: '💻 Tech Hub' },
      { color: '#f39c12', text: '🏥 Health' }
    ];

    legendItems.forEach((item, index) => {
      this.add.text(780, 40 + (index * 18), item.text, {
        fontSize: '10px',
        color: item.color,
        backgroundColor: '#000000',
        padding: { x: 2, y: 1 }
      }).setOrigin(1, 0).setDepth(20);
    });
  }

  private handleQuestZoneInteraction(
    player: Phaser.Physics.Arcade.Sprite,
    questZone: Phaser.Physics.Arcade.Sprite
  ) {
    const questData = questZone.getData('questData');
    
    // Add visual feedback
    this.tweens.add({
      targets: questZone,
      scale: { from: 1.1, to: 1.3 },
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    });

    // Switch to quest scene
    this.scene.start('QuestScene', { 
      questData,
      gameData: this.gameData,
      returnScene: 'MapScene'
    });
  }

  private movePlayerTo(x: number, y: number) {
    // Simple pathfinding - move directly to clicked position
    this.physics.moveTo(this.player, x, y, 160);
    
    // Stop movement after reaching destination
    this.time.delayedCall(
      Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) / 160 * 1000,
      () => {
        this.player.setVelocity(0, 0);
      }
    );
  }

  private loadUserData() {
    // Mock user data loading - in real app, fetch from Supabase
    this.gameData = {
      score: 1250,
      level: 3,
      completedQuests: 12,
      activeQuests: ['eco_challenge', 'health_quest'],
    };
    this.updateUI();
  }

  private updateUI() {
    this.ui.scoreText.setText(`Impact Points: ${this.gameData.score}`);
    this.ui.levelText.setText(`Level: ${this.gameData.level}`);
    this.ui.questsText.setText(`Completed: ${this.gameData.completedQuests}`);
    this.ui.locationText.setText(`Location: ${this.currentNeighborhood}`);
  }

  private updateNeighborhood() {
    // Determine current neighborhood based on player position
    const x = this.player.x;
    const y = this.player.y;

    let neighborhood = 'Manhattan';

    if (x < 200 && y < 200) neighborhood = 'Financial District';
    else if (x > 200 && x < 400 && y < 200) neighborhood = 'Midtown';
    else if (x > 400 && y < 200) neighborhood = 'Upper East Side';
    else if (x < 200 && y > 400) neighborhood = 'Greenwich Village';
    else if (x > 200 && x < 400 && y > 400) neighborhood = 'SoHo';
    else if (x > 400 && x < 600 && y > 400) neighborhood = 'Brooklyn';
    else if (x > 600 && y > 300) neighborhood = 'Queens';
    else if (x < 300 && y > 300) neighborhood = 'Harlem';
    else if (y > 350) neighborhood = 'Bronx';

    if (neighborhood !== this.currentNeighborhood) {
      this.currentNeighborhood = neighborhood;
      this.showNeighborhoodNotification(neighborhood);
    }
  }

  private showNeighborhoodNotification(neighborhood: string) {
    const notification = this.add.text(400, 100, `Entering ${neighborhood}`, {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#1e3a8a',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(25);

    // Fade in and out
    this.tweens.add({
      targets: notification,
      alpha: { from: 0, to: 1 },
      duration: 500,
      yoyo: true,
      delay: 1000,
      onComplete: () => {
        notification.destroy();
      }
    });
  }

  private showLandmarkInfo(landmarkName: string) {
    const info = this.add.text(400, 150, `${landmarkName}\nClick to learn more about NYC's impact opportunities!`, {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#2c3e50',
      padding: { x: 8, y: 6 },
      align: 'center'
    }).setOrigin(0.5).setDepth(25);

    // Auto-remove after 3 seconds
    this.time.delayedCall(3000, () => {
      if (info.active) {
        info.destroy();
      }
    });
  }

  // Public method to update game data from external sources
  public updateGameData(newData: Partial<typeof this.gameData>) {
    this.gameData = { ...this.gameData, ...newData };
    this.updateUI();
  }
}

// Quest Scene - Individual quest interaction
class QuestScene extends Phaser.Scene {
  private questData!: any;
  private gameData!: any;
  private returnScene!: string;

  constructor() {
    super({ key: 'QuestScene' });
  }

  init(data: any) {
    this.questData = data.questData;
    this.gameData = data.gameData;
    this.returnScene = data.returnScene;
  }

  create() {
    // Create quest UI background
    const bg = this.add.rectangle(400, 300, 600, 400, 0x2c3e50, 0.95);
    bg.setStrokeStyle(4, 0x3498db);

    // Quest icon based on type
    const iconColors = {
      environmental: 0x2ecc71,
      health: 0xe74c3c,
      community: 0xf39c12,
      tech: 0x9b59b6,
      social: 0xe67e22,
    };

    const questIcon = this.add.circle(
      400, 200, 40, 
      iconColors[this.questData.type as keyof typeof iconColors] || 0x95a5a6
    );

    // Quest title
    this.add.text(400, 260, this.questData.title, {
      fontSize: '24px',
      color: '#ecf0f1',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Quest description
    this.add.text(400, 320, this.questData.description, {
      fontSize: '16px',
      color: '#bdc3c7',
      align: 'center',
      wordWrap: { width: 500 }
    }).setOrigin(0.5);

    // Points reward
    this.add.text(400, 360, `Reward: ${this.questData.points} points`, {
      fontSize: '18px',
      color: '#f1c40f'
    }).setOrigin(0.5);

    // Action buttons
    const acceptButton = this.createButton(320, 420, 'Accept Quest', 0x2ecc71, () => {
      this.acceptQuest();
    });

    const cancelButton = this.createButton(480, 420, 'Cancel', 0xe74c3c, () => {
      this.returnToMap();
    });

    // Close button
    const closeButton = this.add.text(550, 120, '✕', {
      fontSize: '20px',
      color: '#e74c3c'
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
      this.returnToMap();
    });

    // Add entrance animation
    this.tweens.add({
      targets: [bg, questIcon],
      scale: { from: 0, to: 1 },
      duration: 300,
      ease: 'Back.easeOut'
    });
  }

  private createButton(
    x: number, y: number, text: string, color: number, 
    callback: () => void
  ) {
    const button = this.add.rectangle(x, y, 140, 40, color);
    button.setStrokeStyle(2, 0xecf0f1);
    
    const buttonText = this.add.text(x, y, text, {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5);

    button.setInteractive().on('pointerdown', callback);
    
    // Hover effects
    button.on('pointerover', () => {
      button.setFillStyle(color, 0.8);
    }).on('pointerout', () => {
      button.setFillStyle(color, 1);
    });

    return { button, text: buttonText };
  }

  private acceptQuest() {
    // Mock quest acceptance - in real app, send to backend
    console.log('Quest accepted:', this.questData);

    // Add visual feedback
    const successText = this.add.text(400, 480, 'Quest Accepted!', {
      fontSize: '20px',
      color: '#2ecc71'
    }).setOrigin(0.5);

    // Simulate quest completion for demo
    this.time.delayedCall(1000, () => {
      this.completeQuest();
    });
  }

  private completeQuest() {
    // Mock quest completion
    this.gameData.score += this.questData.points;
    this.gameData.completedQuests += 1;
    
    // Check for level up
    const newLevel = Math.floor(this.gameData.score / 500) + 1;
    if (newLevel > this.gameData.level) {
      this.gameData.level = newLevel;
      
      // Level up celebration
      this.add.text(400, 520, '🎉 LEVEL UP! 🎉', {
        fontSize: '18px',
        color: '#f1c40f'
      }).setOrigin(0.5);
    }

    // Show completion message
    const completeText = this.add.text(400, 500, 
      `+${this.questData.points} points earned!`, {
        fontSize: '16px',
        color: '#2ecc71'
      }).setOrigin(0.5);

    // Auto return to map after celebration
    this.time.delayedCall(2000, () => {
      this.returnToMap();
    });
  }

  private returnToMap() {
    // Pass updated game data back to map scene
    this.scene.start(this.returnScene, { gameData: this.gameData });
  }
}

// React component wrapper
interface PhaserGameProps {
  onScoreUpdate?: (score: number) => void;
  onLevelUpdate?: (level: number) => void;
  userProfile?: {
    totalImpactScore: number;
    level: number;
    completedQuests: number;
  };
}

export default function PhaserGame({ 
  onScoreUpdate, 
  onLevelUpdate, 
  userProfile 
}: PhaserGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      gameRef.current = new Phaser.Game(gameConfig);

      // Update game data when user profile changes
      if (userProfile && gameRef.current?.scene.isActive('MapScene')) {
        const mapScene = gameRef.current.scene.getScene('MapScene') as MapScene;
        mapScene.updateGameData({
          score: userProfile.totalImpactScore,
          level: userProfile.level,
          completedQuests: userProfile.completedQuests,
        });
      }
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [userProfile]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div 
        id="phaser-game" 
        className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-900"
        style={{ width: '800px', height: '600px', margin: '0 auto' }}
      />
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>Use arrow keys or WASD to move around the impact world</p>
        <p>Click on quest zones (red squares) to interact with challenges</p>
      </div>
    </div>
  );
}