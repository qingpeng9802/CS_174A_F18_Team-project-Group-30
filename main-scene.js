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
        new myBall(Vec.of(-8, 8, 0)),
        new myBall(Vec.of(-4, 8, 0)),
        new myBall(Vec.of(0, 8, 0)),
        new myBall(Vec.of(4, 8, 0)),
        new myBall(Vec.of(8, 8, 0)),
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

      for (let i = 1; i <= 10; i++) {
        this.shapes.forEach((ball) => ball.move(dt / 10));
      }
      this.shapes.forEach((ball) => ball.draw(graphics_state, this.materials.phong));
    }
  }

const g = Vec.of(0, -80, 0);
const myFloor = -5;

class myBall extends Subdivision_Sphere {
  constructor(position = Vec.of(0, 0, 0), velocity = Vec.of(0, 0, 0), size = Vec.of(1, 1, 1)) {
    super(5);
    this.position = position;
    this.velocity = velocity;
    this.size = size;
  }

  draw(graphics_state, material) {
    let mat = Mat4.translation(this.position).times(Mat4.scale(this.size));
    super.draw(graphics_state, mat, material);
  }

  move(dt, acceleration = g) {
    this.position = this.position.plus(this.velocity.times(dt));
    this.velocity = this.velocity.plus(acceleration.times(dt));
    if (this.position[1] < myFloor && this.velocity[1] < 0)
      this.velocity[1] = -0.9 * this.velocity[1];
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
