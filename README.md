# Credit Risk System

## Project Description

Credit Risk System is an end-to-end AI-powered credit risk assessment platform that predicts the probability of loan default from applicant financial and demographic information.

The system combines a machine learning model with a FastAPI backend, React frontend, PostgreSQL database, Redis caching, authentication, and Docker-based deployment to provide a production-oriented credit decision workflow.

It is designed to simulate how a modern financial risk platform can assist analysts in evaluating loan applications, identifying high-risk applicants, and maintaining prediction history.
blpopj
---

## What Makes It Special?

- **AI-powered Credit Risk Assessment**  
  Uses an XGBoost classification model to estimate loan default probability.

- **End-to-End ML Integration**  
  The trained ML pipeline is directly integrated into a FastAPI backend and exposed through REST APIs.

- **Risk-Based Decision Support**  
  Converts model predictions into Low, Medium, and High risk categories with corresponding recommendations.

- **Explainable Predictions**  
  Provides risk factors and feature-importance information to make model decisions easier to understand.

- **Production-Oriented Architecture**  
  Includes authentication, PostgreSQL persistence, Redis caching, API key support, role-based access control, and Dockerized services.

- **Interactive Web Dashboard**  
  A React + TypeScript frontend allows users to submit applications, view predictions, and track prediction history.

- **Real-Time Prediction Workflow**  
  Applicant data flows through the frontend → API → preprocessing pipeline → ML model → risk assessment → database.

- **Reproducible Deployment Architecture**  
  The complete application is containerized using Docker Compose, making the different services easier to run consistently.

---

## Built By

**Vivek Thakare**

B.Tech — Artificial Intelligence & Machine Learning

GitHub: [Vivek-41-Thakare](https://github.com/Vivek-41-Thakare)

---

## Architecture

```text
                    ┌─────────────────────────┐
                    │     React Frontend      │
                    │   React + TypeScript    │
                    │        MUI + Axios      │
                    └────────────┬────────────┘
                                 │
                                 │ HTTP / REST API
                                 ▼
                    ┌─────────────────────────┐
                    │        Nginx            │
                    │ Reverse Proxy / Gateway │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      FastAPI Backend    │
                    │   Authentication + API  │
                    └───────┬─────────┬───────┘
                            │         │
              ┌─────────────┘         └──────────────┐
              ▼                                      ▼
   ┌─────────────────────┐              ┌─────────────────────┐
   │   ML Prediction     │              │       Redis         │
   │                     │              │       Cache         │
   │ XGBoost Classifier  │              └─────────────────────┘
   │ + Preprocessing     │
   │ + Feature Engineer. │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │      PostgreSQL     │
   │                     │
   │ Users               │
   │ Predictions         │
   │ Prediction History  │
   │ API Keys            │
   └─────────────────────┘
