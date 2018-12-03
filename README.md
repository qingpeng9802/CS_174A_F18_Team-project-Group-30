# CS 174A Term Project - Ball Simulator

Jiayu Hu\
Qingpeng Li\
Yifei Fu

# Description
In this project, we implemented a physics engine in which there are balls generated to interact with other balls, the environment including gravity, and the boundary of a virtualized 3D box. Each ball is modeled as a spring with damping, and its shape will be deformed according to the force that applies to it. Because the balls have damping coefficient, all the balls will be still at the end. The balls have different textures to implement fake bump mapping. Also, the balls’ model can be replaced with a golf ball .obj model to implement an interesting surface.

In addition, we designed a space gravity simulation based on the physics engine that visualizes the interactions between stars and planets in a solar system. The user can interact with the system by adding planets and observe the behavior of a n-body system.

## Advanced Topics: 
* Collision detection
* Newtonian physics simulation
* Fake Bump Mapping
* Imported OBJ files

## Contributions

Jiayu Hu: Designed the code structure, and set up the physics engine, which includes designing the spring model of the balls, enabling the function of forces such as gravitational force, checking collisions for each ball with other balls and the boundary of the box, and simulating each frame of the physics engine.

Qingpeng Li: Created texture materials for fake bump mapping, implemented a function that generates a random texture material from the texture materials storage. Imported a .obj file to shape and use it correctly.

Yifei Fu: Created the gravity simulation by implementing the Newton's law of universal gravitation. Designed the collision behaviors between planets.

# Details 
## Main Scene
The main scene initially is empty, buttons need to be used to generate new balls.

### Buttons
```
"Generate a ball", ["G"]: generate a new ball from a random position.
"addTop", ["T"]: generate a new ball from a fixed position on the top.
"addLeft", ["L"]: generate a new ball from a fixed position on the left.
"addRight", ["R"]: generate a new ball from a fixed position on the right.
"addFront", ["F"]: generate a new ball from a fixed position on the front.
"switchGravity", ["S"]: switch the gravity in the scene, the default is on.
"diffTexture", ["D"]: switch the fake bump mapping on all balls, the default is off.
"switchObj", ["O"]: switch the .obj model file on all balls, default is off.
```

All the balls have random colors when they are generated.
When "diffTexture" is on, all the balls will have random textures for fake bump mapping.
The .obj model is a golf ball model.

## Space Scene

The space scene initially consists of a binary star system. The user can add more planets with the “Add Planet” button and change the gravitational constant with the “Increase/Decrease G” buttons.

# Future Improvements
In our physics engine, use a new way to update velocity and position given an acceleration a = F / m. Assuming that the velocity and position of a particle of the current frame are V0 and X0 respectively, we let the velocity of the next frame be V1 = V0 + a Δt, and make the position of the next frame be X1 = V0 Δt + 1 / 2 a Δt^2. In this way, we can decrease the error in X1 caused by the velocity when a force is very large. For even better precision, we can solve the motion differential equations directly instead of using the Euler Method to approximate the solution. 

For the gravity simulation, add a skybox with stars and realistic models of celestial bodies in the solar system. We can also add explosion visual effects for collisions between planets with a particle system.

# Reference
* Demo code of Fake Bump Mapping and OBJ Model Loader from piazza @331