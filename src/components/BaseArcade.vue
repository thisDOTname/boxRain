<template>
  <div ref="gameContainer" class="game-container">
    <button @click="addBox">Add Box</button>
    <div class="score">Score: {{ score }}</div>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue';
import Phaser from 'phaser';

const gameContainer = ref(null);
const score = ref(0); // Reactive score variable
let phaserScene = null;
let platform = null;
let moveRight = true;
const boxes = [];
const constraints = [];
let game;

const addBox = () => {
  if (phaserScene) {
    const xPosition = Phaser.Math.Between(50, gameContainer.value.clientWidth - 50);
    const box = phaserScene.matter.add.image(xPosition, 50, 'box'); // Use the 'box' image
    box.setScale(0.015); // Adjust scale if necessary
    box.setBounce(0.6); // Adding some bounce
    boxes.push(box);
  }
};

const handleResize = () => {
  if (game) {
    game.scale.resize(gameContainer.value.clientWidth, gameContainer.value.clientHeight);
  }
};

onMounted(() => {
  const config = {
    type: Phaser.AUTO,
    width: '600px',
    height: '100%',
    physics: {
      default: 'matter',
      matter: {
        gravity: { y: 1 },
        debug: true // Disable debug mode
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
    this.load.image('box', '/assets/snowflake.png'); // Load box image
    this.load.image('background', '/assets/background.png'); // Load background image
  }

  function create() {
    phaserScene = this;

    // Add background image
    const background = this.add.image(0, 0, 'background').setOrigin(0, 0);
    background.displayWidth = this.sys.game.config.width;
    background.displayHeight = this.sys.game.config.height;

    // Create static ground with height 0
    this.matter.add.rectangle(game.scale.width / 2, game.scale.height - 10, game.scale.width, 0, { label: 'groundRectangle', isStatic: true });

    // Create static left and right boundaries
    this.matter.add.rectangle(10, game.scale.height / 2, 20, game.scale.height, { label: 'leftWallRectangle', isStatic: true }); // Left boundary
    this.matter.add.rectangle(game.scale.width - 10, game.scale.height / 2, 20, game.scale.height, { label: 'rightWallRectangle', isStatic: true }); // Right boundary

    // Create a moving platform
    const platformHeight = game.scale.height * 0.75;
    platform = this.matter.add.rectangle(400, platformHeight, 200, 10, { label: 'platformRectangle', isStatic: true });

    // Add event listener for pointer down
    this.input.on('pointerdown', (pointer) => {
      const xPosition = pointer.x;
      const box = this.matter.add.image(xPosition, 50, 'box', null, { label: `box_${boxes.length + 1}` }); // Use the 'box' image
      box.setScale(0.015); // Adjust scale if necessary
      box.setBounce(0.6); // Adding some bounce
      boxes.push(box);
    });

    // Add collision event listener
    this.matter.world.on('collisionstart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        const boxesBodyList = boxes.map(b => b.body);

        const platformBounds = platform.bounds;
        const platformLeftEdge = platformBounds.min.x;
        const platformRightEdge = platformBounds.max.x;

        if ((bodyA === platform && boxesBodyList.includes(bodyB) && bodyB.position.x >= platformLeftEdge && bodyB.position.x <= platformRightEdge) ||
          (bodyB === platform && boxesBodyList.includes(bodyA) && bodyA.position.x >= platformLeftEdge && bodyA.position.x <= platformRightEdge)) {
          const box = bodyA === platform ? bodyB : bodyA;

          // If the box is within the platform edges, make it static and add a constraint
          this.matter.body.setStatic(box, true);
          const constraint = this.matter.add.constraint(platform, box, 0, 1, {
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

  function update() {
    // Move the platform left and right
    if (platform) {
      let deltaX = 0;
      if (moveRight) {
        deltaX = 2;
        this.matter.body.setPosition(platform, { x: platform.position.x + deltaX, y: platform.position.y });
        if (platform.position.x >= game.scale.width - 100) {
          moveRight = false;
        }
      } else {
        deltaX = -2;
        this.matter.body.setPosition(platform, { x: platform.position.x + deltaX, y: platform.position.y });
        if (platform.position.x <= 100) {
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
  width: 800px;
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
</style>
