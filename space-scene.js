function rand(min, max) {
  return Math.random() * (max - min) + min;
}
function vec_dist(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}
let g_const = 1;

class myBall {
  constructor(model, material, position = Vec.of(0, 0, 0), velocity = Vec.of(0, 0, 0), size = 1, mass = size ** 3) {
    this.position = position;
    this.velocity = velocity;
    this.force = Vec.of(0, 0, 0);
    this.size = size;
    this.mass = mass;
    this.sizeChange = Vec.of(0, 0, 0);  // SizeChange is always negative.
    this.material = material;
    this.model = model;
  }

  update(dt) {
    let a = this.force.times(1. / this.mass)
    this.position = this.position.plus(this.velocity.times(dt))
      .plus(a.times(0.5 * dt * dt));
    this.velocity = this.velocity.plus(a.times(dt));
    this.force = Vec.of(0,0,0);
  }

  draw(graphics_state) {
    this.sizeVec = Vec.of(this.size, this.size, this.size);

    let mat = Mat4.translation(this.position).times(
      Mat4.scale(this.sizeVec.plus(this.sizeChange)));
    this.model.draw(graphics_state, mat, this.material);
  }
}

window.SpaceScene = window.classes.SpaceScene =
  class SpaceScene extends Scene_Component {
    constructor(context, control_box)     // The scene begins by requesting the camera, shapes, and materials it will need.
    {
      super(context, control_box);    // First, include a secondary Scene that provides movement controls:
      if (!context.globals.has_controls)
        context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

      context.globals.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 100, 100), Vec.of(0, 0, 0), Vec.of(0, 1, 0));
      this.initial_camera_location = Mat4.inverse(context.globals.graphics_state.camera_transform);

      const r = context.width / context.height;
      context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

      const shapes = {
        sphere: new Subdivision_Sphere(4),
      }
      this.submit_shapes(context, shapes);
      this.planets = [];

      // Make some Material objects available to you:
      this.materials =
        {
          test: context.get_instance(Phong_Shader).material(Color.of(1, 1, 0, 1), { ambient: .2 }),
          sun: context.get_instance(Phong_Shader).material(Color.of(1, 1, 1, 1), { ambient: 0.9 }),
          planet: context.get_instance(Phong_Shader).material(Color.of(0.7, 0.7, 0.7, 1), { ambient: 0.4, diffusivity: 1, specularity: 0 }),
        }
      this.planets.push(
        new myBall(this.shapes.sphere, this.materials.sun.override({ color: Color.of(1, 0, 0, 1) }),
          Vec.of(0,0,15),
          Vec.of(5,0,0),
          5,
          100
        ),
        new myBall(this.shapes.sphere, this.materials.sun.override({ color: Color.of(1, 0, 0, 1) }),
          Vec.of(0, 0, -15),
          Vec.of(-5, 0, 0),
          5,
          100
        ),
        new myBall(this.shapes.sphere, this.materials.planet.override({ color: Color.of(0, 1, 0.5, 1) }),
          Vec.of(20, 0, 0),
          Vec.of(0, 20, 0),
          1,
        ),
        new myBall(this.shapes.sphere, this.materials.planet.override({ color: Color.of(0, 1, 0.5, 1) }),
          Vec.of(-60, -20, 0),
          Vec.of(0, 10, 0),
          3,
        ),
        new myBall(this.shapes.sphere, this.materials.planet.override({ color: Color.of(0, 1, 0.5, 1) }),
          Vec.of(-56, -20, 0),
          Vec.of(0, 15, 4),
          0.5,
        )
        );
      this.lights = [new Light(Vec.of(0, 0, 0, 1), Color.of(1, 1, 1, 1), 100000), new Light(Vec.of(-10, 20, 10, 1), Color.of(1, 1, 1, 1), 1000)];
    }
    make_control_panel()            // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    {
      this.key_triggered_button("View solar system", ["0"], () => this.attached = () => this.initial_camera_location);
      this.new_line();
      this.key_triggered_button("Add planet", ["0"], () => {
        this.planets.push(
          new myBall(this.shapes.sphere,
            this.materials.planet.override({ color: Color.of(rand(0, 0.5), rand(0.6, 1), rand(0.6, 1), 1) }),
            Vec.of(rand(10, 30), rand(-20, 20), rand(-20, 20)),
            Vec.of(0,0 , rand(-10, -30)),
            rand(1, 3)
          ));
      });
      this.key_triggered_button("Add Random planet", ["1"], () => {
        this.planets.push(
          new myBall(this.shapes.sphere, 
            this.materials.planet.override({ color: Color.of(rand(0,0.5),rand(0.6,1),rand(0.6,1), 1) }),
            Vec.of(rand(-50,50), rand(-10, 10), rand(-50, 50)),
            Vec.of(rand(-10, 10), rand(-10, 10), rand(-10, 10)),
            rand(1,3)
            ));
      });
      this.key_triggered_button("Add Star", ["2"], () => {
        this.planets.push(
          new myBall(this.shapes.sphere, this.materials.sun.override({ color: Color.of(1, 0, 0, 1) }),
           Vec.of(rand(50,70), rand(-50, 50), rand(-50, 50)),
            Vec.of(-this.planets[0].velocity[0]*2, rand(-15, 15), -this.planets[1].velocity[2]*2),
          5,
          100
        ))
      });
      this.new_line();
      this.key_triggered_button("Decrease G", ["-"], () => {
        g_const *= 0.5;
      });
      this.key_triggered_button("Increase G", ["+"], () => {
        g_const *= 2;
      });
    }
    display(graphics_state) {
      graphics_state.lights = this.lights;
      const t = graphics_state.animation_time / 1000, dt = graphics_state.animation_delta_time / 1000;
      for (let i = 0; i < this.planets.length; i++) {
        for (let j = i+1; j < this.planets.length; j++) {
          const dist = vec_dist(this.planets[i].position, this.planets[j].position);
          let magnitude = g_const * this.planets[i].mass * this.planets[j].mass / (dist ** 2);
          magnitude = Math.min(magnitude, 100);
          this.planets[i].force = this.planets[i].force.plus(this.planets[j].position.minus(this.planets[i].position).times(magnitude));
          this.planets[j].force = this.planets[j].force.plus(this.planets[i].position.minus(this.planets[j].position).times(magnitude));
        }
      }
      for (let i = 0; i < this.planets.length; i++) {
        for (let j = i + 1; j < this.planets.length; j++) {
          if (this.planets[i].to_del || this.planets[j].to_del)
            continue;

          const dist = vec_dist(this.planets[i].position,this.planets[j].position);

          if (dist < Math.max(this.planets[i].size, this.planets[j].size)) {
            this.planets[j].to_del = true;
              this.planets[i].position = (this.planets[i].position.plus(this.planets[j].position)).times(1/2);
              this.planets[i].velocity = 
                (this.planets[i].velocity.times(this.planets[i].mass)).plus(this.planets[j].velocity.times(this.planets[j].mass)).times(1/(this.planets[i].mass + this.planets[j].mass));
              this.planets[i].size = Math.pow(this.planets[i].size ** 3 + this.planets[j].size ** 3, 1/3);
              this.planets[i].mass += this.planets[j].mass;
          }
        }
      }
      this.planets = this.planets.filter(planet => !planet.to_del);
      this.planets.forEach(planet => {
        planet.update(dt);
          planet.draw(graphics_state);
      })
    }
  }


// Extra credit begins here (See TODO comments below):

window.Ring_Shader = window.classes.Ring_Shader =
  class Ring_Shader extends Shader              // Subclasses of Shader each store and manage a complete GPU program.
  {
    material() { return { shader: this } }      // Materials here are minimal, without any settings.
    map_attribute_name_to_buffer_name(name)       // The shader will pull single entries out of the vertex arrays, by their data fields'
    {                                             // names.  Map those names onto the arrays we'll pull them from.  This determines
      // which kinds of Shapes this Shader is compatible with.  Thanks to this function, 
      // Vertex buffers in the GPU can get their pointers matched up with pointers to 
      // attribute names in the GPU.  Shapes and Shaders can still be compatible even
      // if some vertex data feilds are unused. 
      return { object_space_pos: "positions" }[name];      // Use a simple lookup table.
    }
    // Define how to synchronize our JavaScript's variables to the GPU's:
    update_GPU(g_state, model_transform, material, gpu = this.g_addrs, gl = this.gl) {
      const proj_camera = g_state.projection_transform.times(g_state.camera_transform);
      // Send our matrices to the shader programs:
      gl.uniformMatrix4fv(gpu.model_transform_loc, false, Mat.flatten_2D_to_1D(model_transform.transposed()));
      gl.uniformMatrix4fv(gpu.projection_camera_transform_loc, false, Mat.flatten_2D_to_1D(proj_camera.transposed()));
    }
    shared_glsl_code()            // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    {
      return `precision mediump float;
              varying vec4 position;
              varying vec4 center;
      `;
    }
    vertex_glsl_code()           // ********* VERTEX SHADER *********
    {
      return `
        attribute vec3 object_space_pos;
        uniform mat4 model_transform;
        uniform mat4 projection_camera_transform;

        void main()
        { 
        }`;           // TODO:  Complete the main function of the vertex shader (Extra Credit Part II).
    }
    fragment_glsl_code()           // ********* FRAGMENT SHADER *********
    {
      return `
        void main()
        { 
        }`;           // TODO:  Complete the main function of the fragment shader (Extra Credit Part II).
    }
  }
