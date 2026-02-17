# 🚗 API de Veículos — Microsserviços na AWS

> Projeto desenvolvido para a disciplina **Tópicos Especiais em Redes — 2025/2**  
> Universidade Federal do Espírito Santo — Campus Alegre/ES  
> **Autores:** Artur Matos Siqueira e Erik Estevam

---

## 📋 Sobre o Projeto

API REST para gerenciamento de veículos, construída com arquitetura de microsserviços e implantada na AWS. O sistema é composto por três serviços independentes que se comunicam por meio de um Application Load Balancer, com pipeline de CI/CD automatizado via GitHub Actions e deploy Blue/Green sem downtime.

---

## 🏗️ Arquitetura

```
                        ┌─────────────────────────────────┐
                        │   Application Load Balancer      │
                        │   (Path-based routing)           │
                        └────────┬──────────┬─────────┬───┘
                                 │          │         │
                    /api/auth    │ /api/users│  /api/vehicles
                                 ▼          ▼         ▼
                          ┌──────────┐ ┌─────────┐ ┌──────────┐
                          │  Auth    │ │  User   │ │ Vehicle  │
                          │ Service  │ │ Service │ │ Service  │
                          │  :3001   │ │  :3002  │ │  :3003   │
                          └────┬─────┘ └────┬────┘ └────┬─────┘
                               └────────────┴────────────┘
                                            │
                                    ┌───────▼───────┐
                                    │  AWS RDS      │
                                    │  MySQL        │
                                    └───────────────┘
```

---

## 🛠️ Tecnologias

| Componente       | Tecnologia                        |
|------------------|-----------------------------------|
| Backend          | Node.js + Express                 |
| Banco de Dados   | MySQL — AWS RDS                   |
| Containers       | Docker + AWS ECS Fargate          |
| Load Balancer    | AWS Application Load Balancer     |
| Registry         | AWS ECR                           |
| CI/CD            | GitHub Actions                    |
| Deployment       | AWS CodeDeploy (Blue/Green)       |
| Monitoramento    | AWS CloudWatch                    |

---

## 🚀 Serviços e Endpoints

### Auth Service — `/api/auth`

| Método | Rota                | Autenticação | Descrição              |
|--------|---------------------|--------------|------------------------|
| GET    | `/health`           | Não          | Health check           |
| POST   | `/api/auth/login`   | Não          | Login e geração de JWT |
| POST   | `/api/auth/verify`  | Bearer Token | Verifica token JWT     |

### User Service — `/api/users`

| Método | Rota              | Autenticação | Descrição               |
|--------|-------------------|--------------|-------------------------|
| GET    | `/health`         | Não          | Health check            |
| POST   | `/api/users`      | Não          | Criar usuário           |
| GET    | `/api/users`      | Não          | Listar usuários         |
| GET    | `/api/users/:id`  | Não          | Buscar usuário por ID   |
| PUT    | `/api/users/:id`  | Não          | Atualizar usuário       |
| DELETE | `/api/users/:id`  | Não          | Excluir usuário         |

### Vehicle Service — `/api/vehicles`

| Método | Rota                  | Autenticação | Descrição              |
|--------|-----------------------|--------------|------------------------|
| GET    | `/health`             | Não          | Health check           |
| POST   | `/api/vehicles`       | Bearer Token | Criar veículo          |
| GET    | `/api/vehicles`       | Bearer Token | Listar veículos        |
| GET    | `/api/vehicles/:id`   | Bearer Token | Buscar veículo por ID  |
| PUT    | `/api/vehicles/:id`   | Bearer Token | Atualizar veículo      |
| DELETE | `/api/vehicles/:id`   | Bearer Token | Excluir veículo        |

---

## ⚡ Como Usar

### 1. Login

```bash
curl -X POST http://veiculos-alb-1142325911.us-east-1.elb.amazonaws.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com","password":"suasenha"}'
```

### 2. Usar o token nas requisições

```bash
curl -X GET http://veiculos-alb-1142325911.us-east-1.elb.amazonaws.com/api/vehicles \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 3. Criar um veículo

```bash
curl -X POST http://veiculos-alb-1142325911.us-east-1.elb.amazonaws.com/api/vehicles \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Toyota",
    "model": "Corolla",
    "year": 2024,
    "color": "Prata",
    "plate": "ABC1D23",
    "price": 95000,
    "status": "disponível"
  }'
```

---

## 🔄 Pipeline CI/CD

O projeto utiliza GitHub Actions com três jobs encadeados:

```
push para main
      │
      ▼
  ┌────────┐     ┌──────────────────┐     ┌─────────────────────┐
  │  Test  │────▶│ Build & Push ECR │────▶│ Deploy (Blue/Green) │
  └────────┘     └──────────────────┘     └─────────────────────┘
```

1. **Test** — Executa linter e testes unitários dos três serviços em paralelo
2. **Build & Push** — Builda as imagens Docker e envia para o AWS ECR com tag do commit
3. **Deploy** — Atualiza as Task Definitions no ECS e executa deploy Blue/Green via CodeDeploy com traffic shifting gradual

---

## 🗄️ Banco de Dados

O banco MySQL está hospedado no AWS RDS com as seguintes tabelas principais:

- `users` — Usuários do sistema com roles `admin` e `user`
- `vehicles` — Cadastro de veículos com status `disponível`, `vendido` ou `manutenção`

---

## 🔒 Segurança

- Senhas armazenadas com hash **bcrypt**
- Autenticação via **JWT** com expiração configurável
- Secrets gerenciados pelo **AWS Secrets Manager**
- Security Groups restritivos — RDS acessível apenas pelo ECS
- IAM roles com princípio de **least privilege**

---

## 📊 Monitoramento

Logs centralizados no **AWS CloudWatch** com grupos por serviço:

- `/ecs/auth-service`
- `/ecs/user-service`
- `/ecs/vehicle-service`

Alarmes configurados para CPU > 80%, Memória > 80% e erros HTTP 5xx.

---

## 🏃 Executar Localmente

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/veiculos-api.git
cd veiculos-api

# Subir todos os serviços
docker-compose up -d

# Verificar se estão rodando
docker-compose ps

# Testar health checks
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

---

## 📁 Estrutura do Projeto

```
veiculos-api/
├── services/
│   ├── auth-service/
│   ├── user-service/
│   └── vehicle-service/
├── infrastructure/
│   ├── appspec.yml
│   ├── auth-service-task-definition.json
│   ├── user-service-task-definition.json
│   └── vehicle-service-task-definition.json
├── database/
│   └── schema.sql
├── .github/
│   └── workflows/
│       └── ci-cd.yml
└── docker-compose.yml
```

---

## 👥 Autores

| Nome | Instituição |
|------|-------------|
| Artur Matos Siqueira | UFES — Campus Alegre/ES |
| Erik Estevam | UFES — Campus Alegre/ES |

**Disciplina:** Tópicos Especiais em Redes — 2025/2  
**Professor:** —  
**Universidade Federal do Espírito Santo**
