<template>
  <div ref="gameContainer" class="w-full h-screen m-auto p-0 overflow-hidden border border-black relative">
    <div class="absolute top-3 right-3 z-10 text-2xl font-extrabold text-gray-500 bg-white p-2 rounded-md">Score {{
      score }}</div>
    <div class="absolute flex top-3 left-3 z-10 text-xl text-black bg-white p-2 rounded-md" v-if="isBarrelSelected">
      <template v-for="i in remainingMoves" :key="`remaining_barrel_${i}`">
        <img src="../../public/assets/barrel.png" class="mx-1" width="20px" />
      </template>
      <div class=" text-base text-gray-500" v-if="!remainingMoves">
        Game over!
      </div>
    </div>
    <div
      class="absolute flex top-16 left-3 z-10 text-2xl font-extrabold text-black bg-white h-12 w-12 rounded-full items-center justify-center cursor-pointer"
      @click="$emit('closeGame')">
      X
    </div>
    <div
      class="absolute flex top-16 left-16 z-10 text-2xl font-extrabold text-black bg-white h-12 w-12 rounded-full items-center justify-center cursor-pointer"
      @click="$emit('restart')">
      <RestartIcon class="p-2" />
    </div>
    <div
      class="absolute flex top-16 left-32 z-10 text-2xl font-extrabold text-black bg-white h-12 w-12 rounded-full items-center justify-center cursor-pointer"
      @click="state.toggleVolume()">
      <VolumeOnIcon v-if="state.isVolumeOn" />
      <VolumeOffIcon v-else />
    </div>
    <div class="absolute flex top-3 left-3 z-10 text-xl text-black bg-white p-2 rounded-md" v-if="isBombSelected">
      <template v-for="i in remainingBombs" :key="`remaining_bomb_${i}`">
        <img src="../../public/assets/bomb.png" class="mx-1" width="20px" />
      </template>
      <div class=" text-base text-gray-500" v-if="!remainingBombs">
        No more bombs!
      </div>
    </div>
    <div class="absolute flex top-16 right-16 z-10 text-xl text-black bg-white p-2 rounded-md cursor-pointer"
      :class="{ ' bg-purple-400 border-2 border-purple-700': isBarrelSelected }" @click="switchMode('barrel')">
      <img src="../../public/assets/barrel.png" width="20px" />
    </div>
    <div class="absolute flex top-16 right-3 z-10 text-xl text-black bg-white p-2 rounded-md cursor-pointer"
      :class="{ ' bg-purple-400 border-2 border-purple-700': isBombSelected, 'opacity-50 cursor-not-allowed': !remainingBombs }"
      @click="switchMode('bomb')">
      <img src="../../public/assets/bomb.png" width="24px" />
    </div>
    <GameOver :score="score" :moves="remainingMoves" :bombs="remainingBombs" @again="$emit('restart')"
      :show="isGameOver">
    </GameOver>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount, computed, watch } from 'vue';
import Phaser from 'phaser';
import GameOver from '@/components/GameOver.vue'
import VolumeOnIcon from '@/components/icons/IconVolumeOn.vue'
import VolumeOffIcon from '@/components/icons/IconVolumeOff.vue'
import RestartIcon from '@/components/icons/IconRestart.vue'
import { useStateStore } from '@/stores/state'

const state = useStateStore()
const gameContainer = ref(null);
const score = ref(0); // Reactive score variable
const maxBoxes = 10;
const maxBombs = 3;
const remainingMoves = ref(maxBoxes); // Reactive remaining moves variable
const remainingBombs = ref(maxBombs); // Reactive remaining moves variable
let selectedMode = ref('barrel');
const isBarrelSelected = computed(() => selectedMode.value === 'barrel')
const isBombSelected = computed(() => selectedMode.value === 'bomb')
let phaserScene = null;
let platform = null;
let moveRight = true;
const boxes = [];
const constraints = ref([]);
let game;
let collisionSound;
let fallSound;
let dropSound;
let explodeSound;
let gameOver = ref(false);
const isGameOver = computed(() => gameOver.value)

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

const switchMode = (mode) => {
  if (mode === 'bomb' && !remainingBombs.value)
    return false;
  selectedMode.value = mode;
}
watch(remainingBombs, (value) => {
  if (!value) {
    switchMode('barrel');
  }
})

watch(remainingMoves, (value) => {
  if (!value) {
    setTimeout(() => { gameOver.value = true }, 3000)
  }
})

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
    this.load.image('box', '/assets/barrel-scaled.png'); // Load box image
    this.load.image('background', '/assets/oceanbg.png'); // Load background image
    this.load.image('platform', '/assets/platform-scaled.png'); // Load platform image
    this.load.image('helicopter', '/assets/helicopter.png'); // Load helicopter image
    this.load.image('bomb', '/assets/bomb-scaled.png'); // Load bomb image
    this.load.spritesheet('explosion', '/assets/explosion.png', {
      frameWidth: 260,
      frameHeight: 300
    }); // Load explosion spritesheet
    this.load.audio('collision', '/assets/collision.mp3'); // Load collision sound
    this.load.audio('fall', '/assets/fall.mp3'); // Load fall sound
    this.load.audio('drop', '/assets/drop.mp3'); // Load drop sound
    this.load.audio('explode', '/assets/explode.mp3'); // Load drop sound
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
    platform.setScale(0.2); // Adjust initial scale if necessary

    collisionSound = this.sound.add('collision'); // Add the collision sound
    fallSound = this.sound.add('fall'); // Add the fall sound
    dropSound = this.sound.add('drop'); // Add the drop sound
    explodeSound = this.sound.add('explode'); // Add the explode sound

    // Create explosion animation
    this.anims.create({
      key: 'explode',
      frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 6 }),
      frameRate: 20,
      repeat: 0
    });

    // Add event listener for left-click to drop a box
    this.input.on('pointerdown', (pointer) => {
      if (isBombSelected.value && remainingBombs.value >= 1) {
        dropBomb(pointer.x);
      } else if (isBarrelSelected.value && remainingMoves.value >= 1) {
        dropBox(pointer.x);
      } else {
        gameOver.value = true
      }
      /* if (pointer.rightButtonDown()) {
        // Right-click to drop a bomb
        dropBomb(pointer.x);
      } else if (remainingMoves.value >= 1) {
        // Left-click to drop a box
        dropBox(pointer.x);
      } else {
        alert(`Your score: ${score.value}`);
      } */
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
          constraints.value.push(constraint);
          // Increment score when a box lands on the platform
          score.value += 1;
        }

        // Check for bomb collision with boxes on the platform
        if ((bodyA.label.includes('bomb') && boxesBodyList.includes(bodyB)) || (bodyB.label.includes('bomb') && boxesBodyList.includes(bodyA))) {
          const bomb = bodyA.label.includes('bomb') ? bodyA.gameObject : bodyB.gameObject;
          const box = bodyA.label.includes('bomb') ? bodyB.gameObject : bodyA.gameObject;

          // Remove the specific box that collides with the bomb
          if (boxesBodyList.includes(box.body)) {
            // Play explosion animation
            const explosion = phaserScene.add.sprite(box.x, box.y, 'explosion').play('explode');
            explosion.on('animationcomplete', () => {
              explosion.destroy(); // Remove the explosion sprite after animation
            });

            box.destroy(); // Remove the box from the scene
            const constraintIndex = constraints.value.findIndex(c => c.bodyB === box.body);
            if (constraintIndex !== -1) {
              this.matter.world.remove(constraints.value[constraintIndex]);
              constraints.value.splice(constraintIndex, 1); // Remove the specific constraint
            }
            const boxIndex = boxes.indexOf(box);
            if (boxIndex !== -1) {
              boxes.splice(boxIndex, 1); // Remove the specific box
            }
          }

          // Remove the bomb after collision
          if (bomb) {
            bomb.destroy(); // Remove the bomb from the scene
          }
          score.value -= 1;
          explodeSound.play()
        }
      });
    });
  }

  function dropBox(xPosition) {
    const helicopter = phaserScene.add.image(xPosition, -50, 'helicopter'); // Create helicopter image
    helicopter.setScale(0.5); // Scale the helicopter
    helicopter.setDepth(1); // Ensure the helicopter is in front of other objects

    // Animate the helicopter dropping the box
    phaserScene.tweens.add({
      targets: helicopter,
      y: 100,
      duration: 1000,
      ease: 'Power1',
      onComplete: () => {
        // Play drop sound
        dropSound.play();
        const box = phaserScene.matter.add.image(xPosition, helicopter.y + 50, 'box', null, { label: `box_${boxes.length + 1}` }); // Use the 'box' image
        box.setScale(0.425); // Adjust scale if necessary
        box.setBounce(1); // Adding some bounce
        boxes.push(box);
        remainingMoves.value -= 1; // Decrease remaining moves count

        // Animate the helicopter moving up
        phaserScene.tweens.add({
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
  }

  function dropBomb(xPosition) {
    const helicopter = phaserScene.add.image(xPosition, -50, 'helicopter'); // Create helicopter image
    helicopter.setScale(0.5); // Scale the helicopter
    helicopter.setDepth(1); // Ensure the helicopter is in front of other objects

    // Animate the helicopter dropping the bomb
    phaserScene.tweens.add({
      targets: helicopter,
      y: 100,
      duration: 1000,
      ease: 'Power1',
      onComplete: () => {
        // Play drop sound
        dropSound.play();
        const bomb = phaserScene.matter.add.image(xPosition, helicopter.y + 50, 'bomb', null, { label: `bomb_${boxes.length + 1}` }); // Use the 'bomb' image
        bomb.setScale(0.4); // Adjust scale if necessary
        bomb.setBounce(0.6); // Adding some bounce
        remainingBombs.value -= 1;

        // Animate the helicopter moving up
        phaserScene.tweens.add({
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
      constraints.value.forEach(constraint => {
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

.select-payload {
  position: absolute;
  top: 60px;
  left: 10px;
  z-index: 10;
  font-size: 20px;
  color: white;
  background-color: white;
  padding: 5px;
  border-radius: 5px;
}
</style>
