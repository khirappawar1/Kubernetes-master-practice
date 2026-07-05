Troubleshooting Guide – Project 3 (Node.js + MongoDB + Ingress on Kind)
Problem

While accessing:

http://dashboard.local:8080

I received:

503 Service Temporarily Unavailable
Troubleshooting Flow
Step 1: Check Pods

Command

kubectl get pods -n dashoboard-demo

Purpose

Verify whether application Pods are running.

Healthy Output

NAME                                 READY   STATUS
nodejs-deployment-xxxxx              1/1     Running
mongodb-deployment-xxxxx             1/1     Running
Step 2: Check Services

Command

kubectl get svc -n dashoboard-demo

Purpose

Ensure Kubernetes Service exists and exposes the correct port.

Healthy Output

nodejs-service
mongodb-service
Step 3: Check Endpoints ⭐

Command

kubectl get endpoints -n dashoboard-demo

Purpose

Verify whether the Service has discovered backend Pods.

Healthy Output

nodejs-service
10.244.x.x:3000

If Empty

nodejs-service <none>

This means:

Wrong labels
Wrong selector
Pods are NotReady
Step 4: Verify Deployment Labels

Command

kubectl get deployment nodejs-deployment -n dashoboard-demo --show-labels

Purpose

Ensure Deployment labels match the Service selector.

Example

LABELS

app=nodejs
Step 5: Verify Pod Labels

Command

kubectl get pods -n dashoboard-demo --show-labels

Purpose

Check Pod labels.

Example

app=nodejs
Step 6: Verify Service Selector

Command

kubectl describe svc nodejs-service -n dashoboard-demo

Purpose

Confirm Service selects the correct Pods.

Example

Selector:

app=nodejs

Endpoints:

10.244.4.8:3000
Step 7: Verify Ingress

Command

kubectl describe ingress dashboard-ingress -n dashoboard-demo

Purpose

Ensure Ingress routes traffic to the correct Service.

Example

Host:

dashboard.local

Backend:

nodejs-service:80
Step 8: Check Application Logs

Command

kubectl logs deployment/nodejs-deployment -n dashoboard-demo

Purpose

Verify application startup.

Healthy Output

Server running on 3000

MongoDB Connected
Step 9: Describe Pod

Command

kubectl describe pod <nodejs-pod-name> -n dashoboard-demo

Purpose

Check Kubernetes Events.

Initially, we observed:

Readiness probe failed

Liveness probe failed

connection refused

This indicated Kubernetes couldn't reach the application.

Step 10: Verify Probe Configuration

Deployment contained:

readinessProbe:
  httpGet:
    path: /health
    port: 3000

livenessProbe:
  httpGet:
    path: /health
    port: 3000

The application needed:

app.get("/health",(req,res)=>{
    res.send("Healthy");
});

Without this endpoint, Kubernetes marks the Pod NotReady.

Step 11: Verify Application Port

Ensure Express listens on all interfaces.

const PORT = process.env.PORT || 3000;

app.listen(PORT,"0.0.0.0",()=>{
    console.log(`Server running on ${PORT}`);
});
Step 12: Rebuild Docker Image

Whenever application code changes:

docker build -t node-dashboard:v1 .
Step 13: Load Image into Kind
kind load docker-image node-dashboard:v1 --name devops-cluster

This copies the updated image to every Kind node.

Step 14: Restart Deployment
kubectl rollout restart deployment nodejs-deployment -n dashoboard-demo

This recreates Pods using the updated image.

Step 15: Watch Pods
kubectl get pods -n dashoboard-demo -w

Wait until:

READY

1/1
Step 16: Port Forward Ingress
kubectl port-forward -n ingress-nginx service/ingress-nginx-controller 8080:80

Purpose:

Expose the Ingress Controller running inside the Kind cluster to the local machine.

Step 17: Update Hosts File

Add:

127.0.0.1 dashboard.local

Purpose:

Map dashboard.local to localhost for local Ingress testing.

Step 18: Test Using Browser
http://dashboard.local:8080

Application loaded successfully.

Root Cause Analysis

Initially, Kubernetes reported:

Readiness probe failed

connection refused

The application image was rebuilt after code changes, but the updated image was not loaded into the Kind cluster. As a result, the running Pods continued using the older image, which caused the readiness and liveness probes to fail.

After rebuilding the image, loading it into Kind, and restarting the Deployment, the Pods became Ready, the Service had healthy endpoints, and the Ingress successfully routed traffic to the application.

Production Troubleshooting Order
User reports application is unavailable
                │
                ▼
1. Check Pods
                │
                ▼
2. Check Logs
                │
                ▼
3. Check Services
                │
                ▼
4. Check Endpoints
                │
                ▼
5. Check Ingress
                │
                ▼
6. Check Readiness/Liveness Probes
                │
                ▼
7. Verify Docker Image
                │
                ▼
8. Restart Deployment
                │
                ▼
9. Verify Application Access