<template>
  <div ref="gameContainer" class="game-container">
    <div class="score">Score: {{ score }}</div>
    <div class="remaining-moves">Remaining Moves: {{ remainingMoves }}</div>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue';
import Phaser from 'phaser';

const gameContainer = ref(null);
const score = ref(0); // Reactive score variable
const maxBoxes = 10;
const remainingMoves = ref(maxBoxes); // Reactive remaining moves variable
let phaserScene = null;
let platform = null;
let moveRight = true;
const boxes = [];
const constraints = [];
let game;
let collisionSound;
let fallSound;
let dropSound;

const handleResize = () => {
  if (game) {
    game.scale.resize(gameContainer.value.clientWidth, gameContainer.value.clientHeight);
    // Ensure background resizes correctly
    const background = phaserScene.children.getByName('background');
    if (background) {
      background.setDisplaySize(gameContainer.value.clientWidth, gameContainer.value.clientHeight);
    }
  }
};

onMounted(() => {
  const config = {
    type: Phaser.AUTO,
    width: '100%',
    height: '100%',
    physics: {
      default: 'matter',
      matter: {
        gravity: { y: 1 },
        debug: false // Disable debug mode
      }
    },
    scene: {
      preload,
      create,
      update
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    parent: gameContainer.value
  };

  game = new Phaser.Game(config);

  function preload() {
    this.load.image('box', '/assets/barrel.png'); // Load box image
    this.load.image('background', '/assets/oceanbg.png'); // Load background image
    this.load.image('platform', '/assets/platform.png'); // Load platform image
    this.load.image('helicopter', '/assets/helicopter.png'); // Load helicopter image
    this.load.audio('collision', '/assets/collision.mp3'); // Load collision sound
    this.load.audio('fall', '/assets/fall.mp3'); // Load fall sound
    this.load.audio('drop', '/assets/drop.mp3'); // Load fall sound
  }

  function create() {
    phaserScene = this;

    // Add background image
    const background = this.add.image(0, 0, 'background').setOrigin(0, 0).setName('background');
    background.setDisplaySize(this.scale.width, this.scale.height);
    background.setDepth(-1); // Ensure the background is behind other game objects

    // Create static ground with height 0
    this.matter.add.rectangle(game.scale.width / 2, game.scale.height - 10, game.scale.width, 0, { label: 'groundRectangle', isStatic: true });

    // Create static left and right boundaries
    this.matter.add.rectangle(10, game.scale.height / 2, 20, game.scale.height, { label: 'leftWallRectangle', isStatic: true }); // Left boundary
    this.matter.add.rectangle(game.scale.width - 10, game.scale.height / 2, 20, game.scale.height, { label: 'rightWallRectangle', isStatic: true }); // Right boundary

    // Create a moving platform
    const platformHeight = game.scale.height * 0.75;
    platform = this.matter.add.image(400, platformHeight, 'platform', null, { label: 'platformRectangle', isStatic: true });
    platform.setScale(0.05, 0.1); // Adjust initial scale if necessary

    collisionSound = this.sound.add('collision'); // Add the collision sound
    fallSound = this.sound.add('fall'); // Add the fall sound
    dropSound = this.sound.add('drop'); // Add the fall sound

    // Add event listener for pointer down
    this.input.on('pointerdown', (pointer) => {
      if (remainingMoves.value >= 1) {
        const xPosition = pointer.x;

        const helicopter = this.add.image(xPosition, -50, 'helicopter'); // Create helicopter image
        helicopter.setScale(0.5); // Scale the helicopter
        helicopter.setDepth(1); // Ensure the helicopter is in front of other objects

        // Animate the helicopter dropping the box
        this.tweens.add({
          targets: helicopter,
          y: 100,
          duration: 1000,
          ease: 'Power1',
          onComplete: () => {
            // Play fall sound
            dropSound.play();
            const box = this.matter.add.image(xPosition, helicopter.y + 50, 'box', null, { label: `box_${boxes.length + 1}` }); // Use the 'box' image
            box.setScale(0.05); // Adjust scale if necessary
            box.setBounce(0.6); // Adding some bounce
            boxes.push(box);
            remainingMoves.value -= 1; // Decrease remaining moves count

            // Animate the helicopter moving up
            this.tweens.add({
              targets: helicopter,
              y: -100,
              duration: 1000,
              ease: 'Power1',
              onComplete: () => {
                helicopter.destroy(); // Remove the helicopter after it moves up
              }
            });
          }
        });

        /* const box = this.matter.add.image(xPosition, 50, 'box', null, { label: `box_${boxes.length + 1}` }); // Use the 'box' image
        box.setScale(0.05); // Adjust scale if necessary
        box.setBounce(0.6); // Adding some bounce
        boxes.push(box);
        remainingMoves.value -= 1; // Decrease remaining moves count */
      } else {
        alert(`Your score : ${score.value}`);
      }
    });

    // Add collision event listener
    this.matter.world.on('collisionstart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        const boxesBodyList = boxes.map(b => b.body);

        const platformBounds = platform.getBounds();
        const platformLeftEdge = platformBounds.left;
        const platformRightEdge = platformBounds.right;

        if ((bodyA === platform.body && boxesBodyList.includes(bodyB) && bodyB.position.x >= platformLeftEdge && bodyB.position.x <= platformRightEdge) ||
          (bodyB === platform.body && boxesBodyList.includes(bodyA) && bodyA.position.x >= platformLeftEdge && bodyA.position.x <= platformRightEdge)) {
          const box = bodyA === platform.body ? bodyB : bodyA;

          // Play collision sound
          collisionSound.play();

          // Update the platform appearance based on the number and position of boxes
          updatePlatformAppearance();

          // If the box is within the platform edges, make it static and add a constraint
          this.matter.body.setStatic(box, true);
          const constraint = this.matter.add.constraint(platform.body, box, 0, 1, {
            pointA: { x: 0, y: 0 },
            pointB: { x: 0, y: 0 },
            stiffness: 1,
            damping: 1
          });
          constraints.push(constraint);
          // Increment score when a box lands on the platform
          score.value += 1;
        }
      });
    });
  }

  function updatePlatformAppearance() {
    // Change platform color based on the number of boxes
    if (boxes.length === 1) {
      platform.setTint(0xffa07a); // Red
    } else if (boxes.length === 2) {
      platform.setTint(0xe9967a); // Yellow
    } else if (boxes.length === 3) {
      platform.setTint(0xfa8072); // Yellow
    } else if (boxes.length === 4) {
      platform.setTint(0xf08080); // Yellow
    } else if (boxes.length >= 5) {
      platform.setTint(0xcd5c5c); // Yellow
    } else {
      platform.clearTint(); // Default color
    }
  }

  function update() {
    fallSound
    // Move the platform left and right
    if (platform) {
      let deltaX = 0;
      if (moveRight) {
        deltaX = 2;
        this.matter.body.setPosition(platform.body, { x: platform.x + deltaX, y: platform.y });
        if (platform.x >= game.scale.width - 100) {
          moveRight = false;
        }
      } else {
        deltaX = -2;
        this.matter.body.setPosition(platform.body, { x: platform.x + deltaX, y: platform.y });
        if (platform.x <= 100) {
          moveRight = true;
        }
      }
      // Update the position of the boxes attached to the platform
      constraints.forEach(constraint => {
        const box = constraint.bodyB;
        this.matter.body.setPosition(box, { x: box.position.x + deltaX, y: box.position.y });
      });
    }

    // Remove boxes that reach the bottom of the container
    for (let i = boxes.length - 1; i >= 0; i--) {
      const box = boxes[i];
      if (box.y >= game.scale.height - 10) { // Adjust based on the container height
        // Play fall sound
        fallSound.play();
        box.destroy(); // Use destroy method
        boxes.splice(i, 1);
      }
    }
  }

  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  if (game) {
    game.destroy(true);
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.game-container {
  width: 100%;
  height: 100vh;
  margin: auto;
  padding: 0;
  overflow: hidden;
  border: 1px solid black;
  position: relative;
}

button {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
}

.score {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  font-size: 24px;
  color: white;
  background-color: black;
  padding: 5px;
  border-radius: 5px;
}

.remaining-moves {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
  font-size: 20px;
  color: white;
  background-color: black;
  padding: 5px;
  border-radius: 5px;
}
</style>
