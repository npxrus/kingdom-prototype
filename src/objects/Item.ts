import Phaser from "phaser";
import { ItemData } from "../types/ItemTypes";

export class Item extends Phaser.Physics.Arcade.Sprite {
  public itemData: ItemData;
  private pickupTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, itemData: ItemData) {
    super(scene, x, y, "__WHITE");

    this.itemData = itemData;

    // Добавляем в сцену и физику
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Визуальное оформление
    this.setTint(itemData.color);
    this.setDisplaySize(24, 24);

    // Лэгкое парение (анимация)
    this.startFloatingAnimation();
  }

  private startFloatingAnimation() {
    // Анимация парения вверх-вниз
    this.pickupTween = this.scene.tweens.add({
      targets: this,
      y: this.y - 5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  // Эффект при подборе
  pickup(): void {
    // Останавливаем анимацию парения
    if (this.pickupTween) {
      this.pickupTween.stop();
    }

    // Анимация исчезновения
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        this.destroy();
      },
    });
  }

  // Обновление позиции для анимации (вызывается из сцены, если нужно)
  updateFloating(): void {
    // Анимация управляется твином, здесь ничего не нужно
  }
}
