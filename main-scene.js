window.Assignment_Three_Scene = window.classes.Assignment_Three_Scene =
  class Assignment_Three_Scene extends Scene_Component {
    constructor(context, control_box)     // The scene begins by requesting the camera, shapes, and materials it will need.
    {
      super(context, control_box);    // First, include a secondary Scene that provides movement controls:
      if (!context.globals.has_controls)
        context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

      context.globals.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 0, 20), Vec.of(0, 0, 0), Vec.of(0, 1, 0));

      const r = context.width / context.height;
      context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

      // TODO:  Create two cubes, including one with the default texture coordinates (from 0 to 1), and one with the modified
      //        texture coordinates as required for cube #2.  You can either do this by modifying the cube code or by modifying
      //        a cube instance's texture_coords after it is already created.
      this.shapes = [
        new myBall(Vec.of(-8, 8, 0), Vec.of(5, 5, 0)),
        new myBall(Vec.of(-4, 8, 0), Vec.of(2, -7, 0)),
        new myBall(Vec.of(0, 8, 0), Vec.of(5, 8, 0)),
        new myBall(Vec.of(4, 8, 0), Vec.of(-5, 5, 0)),
        new myBall(Vec.of(8, 8, 0), Vec.of(-8, 0, 0)),
      ];

      this.submit_shapes(context, this.shapes);

      this.materials = {phong: context.get_instance(Phong_Shader).material(Color.of(1, 1, 1, 1))}

      this.lights = [new Light(Vec.of(0, 0, 20, 1), Color.of(1, 1, 1, 1), 100000)];

    }

    make_control_panel() { // TODO:  Implement requirement #5 using a key_triggered_button that responds to the 'c' key.
      this.key_triggered_button("Rotate the cubes", ["c"], () => this.rotation = !this.rotation);
    }

    display(graphics_state) {
      graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
      const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;

      for (let T = 1; T <= 100; T++) {
        this.shapes.forEach((ball) => ball.setupNewMove(dt / 100));
        for (let i = 0; i < this.shapes.length; i++)
          for (let j = i + 1; j < this.shapes.length; j++) {
            myBall.checkBall(this.shapes[i], this.shapes[j]);
            myBall.checkBall(this.shapes[j], this.shapes[i]);
          }
        this.shapes.forEach((ball) => {
          ball.checkFloor();
          ball.checkLeft();
          ball.checkRight();
          ball.update();
        });
      }

      this.shapes.forEach((ball) => ball.draw(graphics_state, this.materials.phong));
    }
  }

const g = Vec.of(0, -20, 0);
const myFloor = -7;
const leftSide = -12;
const rightSide = 12;
const eps = 0.0000001;
const springK = 2000;
const resistance = 0.92;

class myBall extends Subdivision_Sphere {
  constructor(position = Vec.of(0, 0, 0), velocity = Vec.of(0, 0, 0), size = Vec.of(1, 1, 1)) {
    super(5);
    this.position = position;
    this.velocity = velocity;
    this.acceleration = Vec.of(0, 0, 0);  // This is a temporary variable, which is not a state.
    this.size = size;
    this.sizeChange = Vec.of(0, 0, 0);  // SizeChange is always negative.
  }

  update() {
    this.position = this.position.plus(this.velocity.times(this.dt))
      .plus(this.acceleration.times(0.5 * this.dt * this.dt));
    this.velocity = this.velocity.plus(this.acceleration.times(this.dt));
  }

  draw(graphics_state, material) {
    let mat = Mat4.translation(this.position).times(Mat4.scale(this.size.plus(this.sizeChange)));
    super.draw(graphics_state, mat, material);
  }

  checkFloor() {
    let change = Math.max(this.position[1] - myFloor, eps) - this.size[1];
    if (change > 0) return;
    this.sizeChange[1] = change;

    let a = springK * -change / this.size[1];
    this.acceleration = this.acceleration.plus(Vec.of(0, a, 0));
  }

  checkLeft() {
    let change = Math.max(this.position[0] - leftSide, eps) - this.size[0];
    if (change > 0) return;
    this.sizeChange[0] = change;

    let a = springK * -change / this.size[0];
    this.acceleration = this.acceleration.plus(Vec.of(a, 0, 0));
  }

  checkRight() {
    let change = Math.max(rightSide - this.position[0], eps) - this.size[0];
    if (change > 0) return;
    this.sizeChange[0] = change;

    let a = springK * change / this.size[0];
    this.acceleration = this.acceleration.plus(Vec.of(a, 0, 0));
  }

  /**
   * @param {myBall} ball1
   * @param {myBall} ball2
   */
  static checkBall(ball1, ball2) {
    let midPoint = ball1.position.plus(ball2.position).times(0.5);
    let toMid = midPoint.minus(ball1.position);
    let position = toMid.normalized();
    let newSize = toMid;
    for (let i = 0; i < 3; i++) {
      if (position[i] == 0) {
        newSize[i] = ball1.size[i];
        continue;
      }
      newSize[i] /= position[i];
      if (newSize[i] > ball1.size[i])
        return;
    }
    ball1.sizeChange = newSize.minus(ball1.size);

    let a = position.times(springK * ball1.sizeChange.norm() / ball1.size.norm());
    ball2.acceleration = ball2.acceleration.plus(a);
    ball1.acceleration = ball1.acceleration.minus(a);
  }

  setupNewMove(dt, acceleration = g) {
    this.velocity = this.velocity.times(Math.pow(resistance, dt));
    this.acceleration = acceleration;
    this.dt = dt;
  }

}

class Texture_Scroll_X extends Phong_Shader {
  fragment_glsl_code()           // ********* FRAGMENT SHADER *********
  {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Phong_Shader) for requirement #6.
    return `
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          vec2 newCoord =  f_tex_coord;
          newCoord.x += mod(2. * animation_time, 1.);
          vec4 tex_color = texture2D( texture, newCoord );                         // Sample the texture image in the correct place.
                                                                                      // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
        }`;
  }
}

class Texture_Rotate extends Phong_Shader {
  fragment_glsl_code()           // ********* FRAGMENT SHADER *********
  {
    // TODO:  Modify the shader below (right now it's just the same fragment shader as Phong_Shader) for requirement #7.
    return `
        #define PI 3.1415926535897932385
        uniform sampler2D texture;
        void main()
        { if( GOURAUD || COLOR_NORMALS )    // Do smooth "Phong" shading unless options like "Gouraud mode" are wanted instead.
          { gl_FragColor = VERTEX_COLOR;    // Otherwise, we already have final colors to smear (interpolate) across vertices.            
            return;
          }                                 // If we get this far, calculate Smooth "Phong" Shading as opposed to Gouraud Shading.
                                            // Phong shading is not to be confused with the Phong Reflection Model.
          vec2 newCoord = vec2( f_tex_coord.x - 0.5, f_tex_coord.y - 0.5);
          float s = mod(animation_time * PI / 2., 2. * PI);
          mat2 RotationMatrix = mat2(cos(s), sin(s), -sin(s), cos(s));
          newCoord = RotationMatrix * newCoord;
          newCoord.x += 0.5; newCoord.y += 0.5;
          
          vec4 tex_color = texture2D( texture, newCoord );                         // Sample the texture image in the correct place.
                                                                                      // Compute an initial (ambient) color:
          if( USE_TEXTURE ) gl_FragColor = vec4( ( tex_color.xyz + shapeColor.xyz ) * ambient, shapeColor.w * tex_color.w ); 
          else gl_FragColor = vec4( shapeColor.xyz * ambient, shapeColor.w );
          gl_FragColor.xyz += phong_model_lights( N );                     // Compute the final color with contributions from lights.
        }`;
  }
}
