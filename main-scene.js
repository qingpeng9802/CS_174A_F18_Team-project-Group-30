function getRandomNum(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomNumVec(a, b, c, d, e, f) {
  return Vec.of(getRandomNum(a, b), getRandomNum(c, d), getRandomNum(e, f));
}

const floor = -8;
const boxSide = 30;
const boxFront = 30;
const eps = 0.00001;
const springK = 90000;
const springDam = 300;
const resistance = 1.;
const gravity = 30;
var useGravity = true;
var useTexture = false;

window.Project = window.classes.Project =
  class Project extends Scene_Component {
    constructor(context, control_box)     // The scene begins by requesting the camera, shapes, and materials it will need.
    {
      super(context, control_box);    // First, include a secondary Scene that provides movement controls:
      if (!context.globals.has_controls)
        context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

      context.globals.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 0, 50), Vec.of(0, 0, 0), Vec.of(0, 1, 0));

      const r = context.width / context.height;
      context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

      this.shapes = {
        ball: new Subdivision_Sphere(5),
        floor: new Square
      };

      myBall.ballModel = this.shapes.ball;
      this.balls = [];
      this.myColor = [];
      this.myTextures = [];

      this.iteration = 0; // This is used to record the current number of iterations.
      this.simulationPerSecond = 200;

      this.submit_shapes(context, this.shapes);

      this.materials = {
        ball: context.get_instance(Phong_Shader).material(Color.of(0.3, 0.3, 1, 1),
          {ambient: 0.9, diffusivity: 0.5, specularity: 0.5, smoothness: 30}),
        floor: context.get_instance(Phong_Shader).material(Color.of(0.5, 0.5, 0.5, 1),
          {
            ambient: 0.7, diffusivity: 0.5, specularity: 0.5, smoothness: 30,
            texture: context.get_instance("assets/2.jpg", false)
          })
      }

      this.texturematerials = {
        brick: context.get_instance(Fake_Bump_Map).material(Color.of(0.1, 0.1, 0.1, 0.1),
          {
            ambient: 1, diffusivity: .5, specularity: .5, smoothness: 10,
            texture: context.get_instance("assets/brick-texture.jpg")
          }),
        fiber: context.get_instance(Fake_Bump_Map).material(Color.of(0.1, 0.1, 0.1, 0.1),
          {
            ambient: 1, diffusivity: .5, specularity: .5, smoothness: 10,
            texture: context.get_instance("assets/fiber-texture.jpg")
          }),
        leather: context.get_instance(Fake_Bump_Map).material(Color.of(0.1, 0.1, 0.1, 0.1),
          {
            ambient: 1, diffusivity: .5, specularity: .5, smoothness: 10,
            texture: context.get_instance("assets/leather-texture.jpg")
          }),
        metal: context.get_instance(Fake_Bump_Map).material(Color.of(0.1, 0.1, 0.1, 0.1),
          {
            ambient: 1, diffusivity: .5, specularity: .5, smoothness: 10,
            texture: context.get_instance("assets/metal-texture.jpg")
          }),
        rock: context.get_instance(Fake_Bump_Map).material(Color.of(0.1, 0.1, 0.1, 0.1),
          {
            ambient: 1, diffusivity: .5, specularity: .5, smoothness: 10,
            texture: context.get_instance("assets/rock-texture.jpg")
          }),
      }

      this.lights = [new Light(Vec.of(-20, 20, 20, 1), Color.of(1, 1, 1, 1), 100000)];
    }

    switchGravity() {
      useGravity = !useGravity;
    }

    diffTexture() {
      useTexture = !useTexture;
    }

    makeColor() {
      this.myColor.push(Color.of(getRandomNum(0.2, 0.8), getRandomNum(0.2, 0.8), getRandomNum(0.2, 0.8), 1));
    }

    random_texturematerials(texturematerials_list = this.texturematerials) {
      const texturematerials_names = Object.keys(texturematerials_list);
      return texturematerials_list[texturematerials_names[~~(texturematerials_names.length * Math.random())]]
    }

    makeTextures() {
      this.myTextures.push(this.random_texturematerials());
    }

    makeRandomBall() {
      this.balls.push(new myBall(
        getRandomNumVec(-boxSide + 5, boxSide - 5, 20, 20, -boxFront + 5, boxFront - 5),
        getRandomNumVec(-10, 10, 0, 10, -10, 10),
        getRandomNum(3, 4)));
      this.makeColor();
      this.makeTextures();
    }

    addTop() {
      this.balls.push(new myBall(Vec.of(0, 12, 0), Vec.of(0, 0, 0), 4));
      this.makeColor();
      this.makeTextures();
    }

    addLeft() {
      this.balls.push(new myBall(Vec.of(-12, 0, 0), Vec.of(20, 0, 0), 4));
      this.makeColor();
      this.makeTextures();
    }

    addRight() {
      this.balls.push(new myBall(Vec.of(12, 0, 0), Vec.of(-20, 0, 0), 4));
      this.makeColor();
      this.makeTextures();
    }

    addFront() {
      this.balls.push(new myBall(Vec.of(0, 10, 20), Vec.of(0, 0, -200), 4));
      this.makeColor();
      this.makeTextures();
    }

    make_control_panel() {
      this.key_triggered_button("Generate a ball", ["G"], () => this.makeRandomBall());
      this.key_triggered_button("addTop", ["T"], () => this.addTop());
      this.key_triggered_button("addLeft", ["L"], () => this.addLeft());
      this.key_triggered_button("addRight", ["R"], () => this.addRight());
      this.key_triggered_button("addFront", ["F"], () => this.addFront());
      this.key_triggered_button("switchGravity", ["S"], () => this.switchGravity());
      this.key_triggered_button("diffTexture", ["D"], () => this.diffTexture());
    }

    simulate(graphics_state, dt) {
      this.iteration++;
      this.balls.forEach((ball) => ball.setupNewMove(dt));
      for (let i = 0; i < this.balls.length; i++)
        for (let j = i + 1; j < this.balls.length; j++) {
          myBall.checkBall(this.balls[i], this.balls[j]);
          myBall.checkBall(this.balls[j], this.balls[i]);
        }
      this.balls.forEach((ball) => {
        ball.checkBoundary();
        ball.update();
      });
    }

    drawStaticObj(graphics_state) {
      this.floorMat = Mat4.translation([0, floor, 0]).times(Mat4.scale([boxSide, 0, 30]))
        .times(Mat4.rotation(Math.PI / 2, [1, 0, 0]));
      this.shapes.floor.draw(graphics_state, this.floorMat, this.materials.floor);
    }

    display(graphics_state) {
      graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
      const t = graphics_state.animation_time / 1000;
      for (; this.iteration / this.simulationPerSecond < t;)
        this.simulate(graphics_state, 1. / this.simulationPerSecond);

      if (useTexture) {
        this.balls.forEach((ball, i) => ball.draw(graphics_state,
          this.myTextures[i].override({color: this.myColor[i]})));
      }
      else {
        this.balls.forEach((ball, i) => ball.draw(graphics_state,
          this.materials.ball.override({color: this.myColor[i]})));
      }
      this.drawStaticObj(graphics_state);
    }
  }

class myBall {
  constructor(position = Vec.of(0, 0, 0), velocity = Vec.of(0, 0, 0), size = 1, mass = size ** 3) {
    this.position = position;
    this.velocity = velocity;
    this.force = Vec.of(0, 0, 0);  // This is a temporary variable, which is not a state.
    this.size = size;
    this.mass = mass;
    this.sizeVec = Vec.of(size, size, size);
    this.sizeChange = Vec.of(0, 0, 0);  // SizeChange is always negative.
  }

  update() {
    let a = this.force.times(1. / this.mass)
    this.position = this.position.plus(this.velocity.times(this.dt))
      .plus(a.times(0.5 * this.dt * this.dt));
    this.velocity = this.velocity.plus(a.times(this.dt));
  }

  draw(graphics_state, material) {
    let mat = Mat4.translation(this.position).times(
      Mat4.scale(this.sizeVec.plus(this.sizeChange)));
    myBall.ballModel.draw(graphics_state, mat, material);
  }

  checkBoundary() {
    this.chkB(1, 1, floor); // Floor
    this.chkB(0, 1, -boxSide); // Left Side
    this.chkB(0, -1, boxSide); // Right Side
    this.chkB(2, -1, boxFront); // Front
    this.chkB(2, 1, -boxFront); // Back
  }

  chkB(direction, sign, location) {
    let r = this.position[direction] - location;
    if (r * sign > this.size)
      return;
    let x = this.size - Math.max(r * sign, 0.5);
    this.sizeChange[direction] = -x;

    let F = Vec.of(0, 0, 0);
    F[direction] = springK * x;
    F[direction] += -this.velocity[direction] * sign * springDam;
    F[direction] *= sign;
    this.force = this.force.plus(F);
  }

  /**
   * @param {myBall} ball1
   * @param {myBall} ball2
   */
  static checkBall(ball1, ball2) {
    let towards = ball2.position.minus(ball1.position);
    if (towards.every((x) => Math.abs(x) < eps))
      towards = getRandomNumVec(-eps, eps, -eps, eps, -eps, eps);
    let dis = towards.norm();
    if (ball1.size + ball2.size < dis)
      return;

    let toContactPoint = towards.times(1 / (ball1.size + ball2.size) * ball1.size);
    let toContactPointNorm = toContactPoint.norm();
    //if (toContactPoint.norm() > ball1.size)
    //  return;   // Never reach here.

    let position = toContactPoint.times(1 / toContactPointNorm);
    let newSize = toContactPoint.copy();
    for (let i = 0; i < 3; i++) {
      if (Math.abs(position[i]) < eps) {
        newSize[i] = ball1.size;
        continue;
      }
      newSize[i] /= position[i];
      //if (newSize[i] > ball1.size)
      //  return;   // Never reach here.
    }
    ball1.sizeChange = newSize.minus(ball1.sizeVec);

    let dx = -ball2.velocity.minus(ball1.velocity).dot(position);
    let x = ball1.size - toContactPointNorm;

    let F = position.times(springK * x + springDam * dx);
    ball2.force = ball2.force.plus(F);
    ball1.force = ball1.force.minus(F);
  }

  setupNewMove(dt, force = Vec.of(0, -gravity * this.mass, 0)) {
    if (!useGravity)
      force = Vec.of(0, 0, 0);
    this.velocity = this.velocity.times(Math.pow(resistance, dt));
    this.force = force;
    this.dt = dt; // This is used to pass the the dt parameter to the member functions.
    this.sizeChange = Vec.of(0, 0, 0);
  }
}
