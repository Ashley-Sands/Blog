# Designing A Scaleable solution for an multiplayer game server
###### From a single "all-in-one" solution to micro services spaning multiple nodes

# A simple Muliplayer Server

Recently I've been tasked with creating and deploying an online multiplayer service for a turn-based game.  
When I first set out I just wanted to create a very basic game server, clients would connect and join the game, then each client would take it in turns to run some actions that would happen on everyone else’s computer and BOOM multiplayer server done!, great.

Well...

No. I now wanted to start building the game up a little and decided to add a player limit to the level, which now means I had to make the server a little more robust, and do something with any players that arrived once the game is full. So, I went about adding a lobby that would queue the players up and once a player leaves the game the next in the queue would be added to the game, awesome.

Still not awesome enough, I now decided I wanted the game to last for a fixed amount of time and once it started no one could join. So, I changed the server from only being able to handle a single lobby/game to multiple lobbies and games. It was simple in the way it worked, 


![& State UML, server_v1_2-lobby](https://github.com/Ashley-Sands/Comp-260/raw/master/images/Server_v1_2-lobby.png)
[Fig. 1, all-in-one server state UML]


err, ummmm... performance?

At this point all I can think about is performance, obviously with this "all-in-one" approach sooner or later we're going to run into some issues, due the fact we can have any number of lobbies and some fixed amount of games. Eventually it’s going to slow and dramatically impact the gaming experience, which is obviously something we want to avoid at all cost.

# A Scalable Solution

Lucky for me, at this point I was being introduced to the concept of [containerization](https://www.ibm.com/cloud/learn/containerization) [2] using docker [docker](https://www.docker.com/) [3] and [container-orchestration](https://blog.newrelic.com/engineering/container-orchestration-explained/) [4] with [Kubernetes](https://kubernetes.io/) [1]

One of the great things about using containerization is that we can run multiple apps or services totally independent of each other inside of containers which can all communicate with one another over an internal network (known as a [bridge network in docker](https://docs.docker.com/network/) [5]). Another great thing about using docker is the fact that we can run multiple state independent apps (ie a game instance) all on the same node (host/server) and redirect our users/clients to correct containers via a [proxy](https://whatis.techtarget.com/definition/proxy-server) [6].

 
![Proxy concept](https://github.com/Ashley-Sands/Comp-260/raw/master/images/proxy.png)  
[Fig. 2, Reverse Proxy [10]]


Now if we throw Kubernetes into the mix we can replicate a container or groups of containers (known as [pods](https://kubernetes.io/docs/concepts/workloads/pods/pod/) [7] ) among multiple nodes on demand just by adding a new node into the Kubernetes [cluster](https://cloud.google.com/kubernetes-engine/docs/concepts/cluster-architecture) [8]. This is achieved by Kubernetes having a master node within the cluster which contains a copy of the master (or deployment) pod (among other things). If a pod closes for whatever reason (whether it be a crash or graceful) or a new node is added the Kubernetes will spin up new pods automatically to meet the Kubernetes desired state.


![module_02_first_appkubernetesCluster](https://github.com/Ashley-Sands/Comp-260/raw/master/images/module_02_first_app.png)  
[Fig. 3, Kubernetes Cluster [11] ]


Now that we're armed with a (very) basic understanding of docker and Kubernetes, we're able to tackle our scalability vs performance issue from a whole new perspective. 

### From 'All-In-One' to 'Micro-Services'

What if we split our "all-in-one" solution up into individual services and have each one run in its own independent container so that we have one container solely responsible for pinging the client a list of available lobbies, one that is a single lobby instance and another container for an individual game instance.


![& First steps UML](https://github.com/Ashley-Sands/Comp-260/raw/master/images/firstStepsUML.png)  
[Fig. 4, Diagrame showing how the all-in-one solution can be split into indervidule components]


The problem with this is each one of our node/server only has a single IP address, which would mean that in order to have our clients connect to each container we would have to expose multiple ports to the internet and if we span our setup across multiple nodes this would be practically impossible to notify our users which IP/port config they need to connect to. 

So, in order to overcome this new problem, we need to add an intermediate step into the process, so that our users connect to the correct container via a single IP and port. As I briefly mentioned earlier we can use a proxy to forward our users onto the correct container, we just need to find a method to track each user's state as they move through the network (i.e. are they in a lobby or active game?). For that we can run an SQL database in its own docker container and add a new service to authorize new users into the network by assigning them a unique registration key which is then used to identify the users as they move through the network and it doubles up as a way to identify a user if they get disconnected mid game.

So, our docker setup becomes something more like,
 
![& Docker Contaner Basic Setup](https://github.com/Ashley-Sands/Comp-260/raw/master/images/dockerBasic.png)  
[Fig. 5, Diagram showing compleat set of required components and bridge network setup]


The way that this works is during the initial connection stages the user is registered into the network by assigning them a unique registration key via the 'client authorization' container. Once the client can be recognized within the network, they can move onto the lobbies container where they are pinged a list of available game lobbies every few seconds. After the user has decided what lobby they want to join they are forwarded onto the unique instance of the game lobby they have selected. Finally, once the lobby has enough users to launch, the game is queued to await a game slot to become available. Once the slot becomes available the players are moved onto a unique game instance container and the lobby is shut down to free resources.


![& Server 2 non poster](https://github.com/Ashley-Sands/Comp-260/raw/master/images/Server%202%20poster.png)  
[Fig. 6, Compleat state diagram, demonstrating the clients life cycle]


Now if we look back at figure 5 (Fig. 5), our setup is still not practical when it comes to saleability since we still have all of our containers running on a single node and eventually we'll run into the same issues as the "all-in-one" solution and run out of resources. Furthermore it’s also not practical to scale all of our containers up to a 1 to 1 basis. For instance, we don’t need to have one 'client authorization' container per lobby per game, rather we can split up our containers and distribute them among multiple nodes depending on how performance critical they are.


![& docker inferstuctur UML](https://github.com/Ashley-Sands/Comp-260/raw/master/images/infrastructure.png)
[Fig. 7, Infrastructure diagram]


As we can see from the diagrame [Fig. 7], a [load balancer](https://www.citrix.com/en-gb/glossary/load-balancing.html) [9] has been added before the first 2 nodes. This allows us to distribute our clients eventually among nodes that contain components that are not state independent of each other (i.e the 'Client Authorization' and 'Lobby list' components). Once the client has chosen a lobby to join, we are then able to send them the address of the server containing the instance of the lobby that they need to join. Once the lobby period if over the client is once again notified to change to a game server. You may notice that there's no 'container Selector' present on the game servers, this is because the game instance is our most performance critical component, the thinking behind it is to have a little transition points as possible, as each one will take a little processing time.

# A very brief benchmark test.
For the benchmark I will be running the "all-in-one" solution in a single container (no other container running at all) against the "containerized" version as demonstrated in figure 5 [Fig. 5]. For this the benchmark was run locally to eliminate any network traffic, using only three clients. For the test each client pings the server 10 times a second, while the server ends the client a lobby list every 1 second. We will be measuring the overall time taken to send, process and have the packet returned to the client.


![& benchmark timeline](https://github.com/Ashley-Sands/Comp-260/raw/master/images/benchmark%20timeline.png)  
[Fig. 8, The overall journey the ping packet takes]


![figur 9](https://github.com/Ashley-Sands/Comp-260/raw/master/images/3clientPingAIO.PNG)  
[Fig 9, results of 600 pings for 3 clients using the All-in-one approach (time in ms) ]


![figur 10](https://github.com/Ashley-Sands/Comp-260/raw/master/images/3clientPingC.PNG)  
[Fig 10, results of 600 pings for 3 clients using the mocro-service approach (time in ms) ]

As we can see from the results there is roughly 20ms improvement using the containerized approach although there is much larger range. I'm going to investigate this further in the coming weeks and will post my finding in coming week in a follow up post :D.

# To wrap it up.
When I first started out on this project, I never imagined that I would end up designing a multiplayer server that could scale in such a way.  
Creating a scalable solution for a multiplayer server is a mammoth task, and if it's only for a few clients it's probably not worth it, as it takes a lot of time and requires knowledge of a lot of different APIs and services. Not to forget the infrastructure resources that are required of which all cost money. On the other hand however, using a microservice approach gives more control of each individual component of the network, resulting in a cleaner and easier to manage code base. 
As we can see from the brief benchmark there is an improvement using the microservice approach, so we are moving in the right direction, and requires some further digging. Stay tuned!

### References

[1] T. K.  Authors,  “Kubernetes,”  [Online].  available:https://kubernetes.io/, [Accessed:  02-April-2020].  

[2] I. C. Education, “Containerization explained,” [Online]. available: https://www.ibm.com/cloud/learn/containerization, [Accessed:  02-April-2020].  

[3] Docker,   “Docker,”   [Online].   available:https://www.docker.com/,   [Accessed:02-April-2020].  

[4] I. Eldridge,   “What   is   container   orchestration?”[Online].   available:https://blog.newrelic.com/engineering/container-orchestration-explained/,[Accessed:02-April-2020].  

[5] Docker, “Docker networks - overview,” [Online]. available:  https://docs.docker.com/network/, [Accessed:  02-April-2020].  

[6] M.  Rouse,   “Proxy  server),”   [Online].  available:    https://whatis.techtarget.com/definition/proxy-server, [Accessed:  02-April-2020].  

[7] T. K. Authors, “Pods - kubernetes,” [Online]. available: https://kubernetes.io/docs/concepts/workloads/pods/pod/, [Accessed:  02-April-2020].  

[8] Google,   “Cluster   architecture,”   [Online].   available:https://cloud.google.com/kubernetes-engine/docs/concepts/cluster-architecture, [Accessed:  02-April-2020].  

[9] citrix.com, “What is load balancing?”  [Online]. available:  https://www.citrix.com/en-gb/glossary/load-balancing.html, [Accessed:  02-April-2020].  

[10] S. WIJNGAARDE, “Capturing metrics with go’s reverse proxy,” [Online]. available:https://www.sidneyw.com/, [Accessed:  03-April-2020].

[11] T.  K.  Authors,  “Deploying  your  first  app  on  kubernetes,”  [Online].  available:https://kubernetes.io/docs/tutorials/kubernetes-basics/deploy-app/deploy-intro/,[Accessed:  03-April-2020].


### List of Figers

[Fig. 1] all-in-one server state UML  
[Fig. 2] Reverse Proxy [10]  
[Fig. 3] Kubernetes Cluster [11] 
[Fig. 4] Diagram showing how the all-in-one solution can be split into individual components  
[Fig. 5] Diagram showing complete set of required components and bridge network setup  
[Fig. 6] Complete state diagram, demonstrating the clients life cycle  
[Fig. 7] Infrastructure diagram  
[Fig. 8] The overall journey the ping packet takes  
[Fig. 9] results of 600 pings for 3 clients using the All-in-one approach (time in ms)   
[Fig. 10] results of 600 pings for 3 clients using the mocro-service approach (time in ms)  

