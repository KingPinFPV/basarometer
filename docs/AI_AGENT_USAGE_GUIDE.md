# 🤖 Basarometer AI Agent Team - Complete Usage Guide

## Overview

This comprehensive guide provides detailed instructions for using Basarometer's 6-specialist AI agent team. Each agent is designed for autonomous operation with specific expertise areas, tools, and protocols.

## 🏗️ Agent Architecture

### Agent Coordination Matrix
| Scenario | Primary Agent | Secondary Agents | Auto-Triggers |
|----------|---------------|------------------|---------------|
| New Vendor Integration | vendor-integrator | meat-validator → performance-monitor → docs-maintainer | Quality validation, performance check |
| Quality Audit | meat-validator | docs-maintainer → strategic-analyst | Documentation update, trend analysis |
| Performance Issues | performance-monitor | system-optimizer → docs-maintainer | Technical fixes, documentation |
| System Changes | docs-maintainer | All agents (as needed) | Cross-agent coordination |
| Strategic Planning | strategic-analyst | performance-monitor → docs-maintainer | Data validation, documentation |
| Technical Maintenance | system-optimizer | performance-monitor → docs-maintainer | Performance check, documentation |

## 🥩 Meat-Validator Agent

### Core Capabilities
- **942-Term Classification System**: Authoritative Hebrew/English meat terminology
- **100% Purity Validation**: Zero contamination tolerance
- **Quality Score Assignment**: Algorithmic quality assessment
- **Batch Processing**: Handle multiple products simultaneously
- **Confidence Scoring**: Extraction and meat confidence ratings

### Usage Scenarios

#### 🔴 **CRITICAL - MUST USE**
```bash
# New product validation (required before database entry)
I need you to act as the meat-validator specialist. Please validate these new products:
[Product data/list]

# Quality contamination alert
I need you to act as the meat-validator specialist. We have potential contamination in:
[Affected products/sources]

# Pre-deployment quality audit
I need you to act as the meat-validator specialist. Perform complete quality audit before deployment.
```

#### 🟡 **RECOMMENDED - SHOULD USE**
```bash
# Weekly quality monitoring
I need you to act as the meat-validator specialist. Perform weekly quality health check.

# Post-extraction validation
I need you to act as the meat-validator specialist. Validate products extracted from [vendor name].
```

#### 🟢 **AUTO-TRIGGERED**
- When vendor-integrator completes product extraction
- On quality score threshold breaches (<70)
- On database integrity warnings

### Expected Outputs
- **Quality Assessment Report**: Detailed validation results
- **Contamination Alerts**: Non-meat product identification
- **Database Recommendations**: Products ready for integration
- **Quality Trends**: Pattern analysis and recommendations

### Success Metrics
- **100% Meat Purity**: Zero non-meat products in database
- **Quality Score >85**: High-quality product validation
- **Response Time <30s**: Rapid validation processing

---

## 🕷️ Vendor-Integrator Agent

### Core Capabilities
- **Stealth Web Scraping**: Advanced anti-detection techniques
- **Multi-Platform Support**: WooCommerce, Magento, Social Commerce
- **Hebrew Processing**: Perfect RTL text handling
- **Price Extraction**: Accurate pricing with confidence scoring
- **Batch Processing**: Multiple vendor simultaneous extraction

### Usage Scenarios

#### 🔴 **CRITICAL - MUST USE**
```bash
# New vendor integration
I need you to act as the vendor-integrator specialist. Please integrate:
Vendor: [Name]
URL: [Website URL]
Platform: [WooCommerce/Magento/Other]

# Extraction failures
I need you to act as the vendor-integrator specialist. Resolve extraction issues with [vendor name].

# Scaling to new markets
I need you to act as the vendor-integrator specialist. Expand to [market/region].
```

#### 🟡 **RECOMMENDED - SHOULD USE**
```bash
# Regular extraction updates
I need you to act as the vendor-integrator specialist. Update prices from all active vendors.

# Competitive monitoring
I need you to act as the vendor-integrator specialist. Monitor competitor price changes.
```

#### 🟢 **AUTO-TRIGGERED**
- On extraction failure alerts
- When new vendor opportunities are identified
- On competitive price change notifications

### Expected Outputs
- **Vendor Integration Report**: Complete extraction results
- **Product Database**: Clean, validated product data
- **Performance Metrics**: Extraction success rates and timing
- **Expansion Recommendations**: New vendor opportunities

### Success Metrics
- **90%+ Extraction Success**: High reliability across platforms
- **<5 Minutes Integration Time**: Rapid vendor onboarding
- **Zero CAPTCHA Dependency**: Autonomous operation

---

## 📊 Performance-Monitor Agent

### Core Capabilities
- **Real-time Performance Tracking**: API response times, system health
- **Bottleneck Detection**: Identify and resolve performance issues
- **Scalability Analysis**: Capacity planning and optimization
- **Performance Optimization**: Code and infrastructure improvements
- **Proactive Alerting**: Performance threshold monitoring

### Usage Scenarios

#### 🔴 **CRITICAL - MUST USE**
```bash
# Performance degradation alert
I need you to act as the performance-monitor specialist. Resolve performance issues:
Current API response: [time]
Target: <50ms

# Pre-deployment performance validation
I need you to act as the performance-monitor specialist. Validate performance before deployment.

# Scaling preparation
I need you to act as the performance-monitor specialist. Prepare system for [expected load].
```

#### 🟡 **RECOMMENDED - SHOULD USE**
```bash
# Weekly performance checkup
I need you to act as the performance-monitor specialist. Perform weekly system health check.

# Post-change performance validation
I need you to act as the performance-monitor specialist. Validate performance after [changes made].
```

#### 🟢 **AUTO-TRIGGERED**
- API response time >100ms
- Database query time >50ms
- System resource utilization >80%
- After major system changes

### Expected Outputs
- **Performance Report**: Comprehensive system health analysis
- **Optimization Recommendations**: Specific improvement suggestions
- **Capacity Planning**: Scaling recommendations and requirements
- **Performance Trends**: Historical analysis and projections

### Success Metrics
- **<50ms API Response**: Enterprise-grade performance target
- **>99% Uptime**: High availability maintenance
- **Proactive Issue Resolution**: Problems solved before user impact

---

## 📝 Docs-Maintainer Agent

### Core Capabilities
- **Real-time Documentation Sync**: Auto-update on system changes
- **Enterprise-grade Technical Writing**: Professional documentation creation
- **Knowledge Base Management**: Comprehensive information organization
- **Cross-referencing**: Intelligent linking and reference management
- **Template Management**: Consistent documentation standards

### Usage Scenarios

#### 🔴 **CRITICAL - MUST USE**
```bash
# System changes documentation
I need you to act as the docs-maintainer specialist. Update documentation after:
[Describe changes made]

# New feature documentation
I need you to act as the docs-maintainer specialist. Document new feature:
[Feature description]

# API documentation update
I need you to act as the docs-maintainer specialist. Update API docs for:
[API changes]
```

#### 🟡 **RECOMMENDED - SHOULD USE**
```bash
# Weekly documentation review
I need you to act as the docs-maintainer specialist. Perform weekly documentation audit.

# Knowledge base optimization
I need you to act as the docs-maintainer specialist. Optimize documentation structure.
```

#### 🟢 **AUTO-TRIGGERED**
- After other agents complete major work
- On system architecture changes
- On new feature deployments
- Weekly documentation freshness checks

### Expected Outputs
- **Updated Documentation**: Current, accurate system documentation
- **Knowledge Transfer Materials**: Comprehensive handover documentation
- **API Documentation**: Complete endpoint documentation with examples
- **Usage Guides**: Step-by-step operational procedures

### Success Metrics
- **100% Documentation Accuracy**: All docs reflect current system state
- **24-hour Update SLA**: Documentation updated within one day of changes
- **Enterprise Standards**: Professional-grade documentation quality

---

## 🎯 Strategic-Analyst Agent

### Core Capabilities
- **Market Analysis**: Israeli meat market intelligence
- **ROI Calculations**: Business impact assessment
- **Competitive Intelligence**: Market positioning analysis
- **Growth Planning**: Strategic expansion recommendations
- **Data-driven Insights**: Pattern analysis and trend identification

### Usage Scenarios

#### 🔴 **CRITICAL - MUST USE**
```bash
# Strategic decision support
I need you to act as the strategic-analyst specialist. Analyze:
Decision: [Strategic decision needed]
Context: [Business context]

# Expansion planning
I need you to act as the strategic-analyst specialist. Evaluate expansion to:
[Market/vendor/region]

# Competitive threat analysis
I need you to act as the strategic-analyst specialist. Analyze competitive threat:
[Competitor/threat description]
```

#### 🟡 **RECOMMENDED - SHOULD USE**
```bash
# Monthly market analysis
I need you to act as the strategic-analyst specialist. Perform monthly market review.

# ROI analysis
I need you to act as the strategic-analyst specialist. Calculate ROI for:
[Investment/project]
```

#### 🟢 **AUTO-TRIGGERED**
- On major strategic decision points
- Monthly market analysis cycles
- When competitive intelligence indicates threats
- On significant market changes

### Expected Outputs
- **Strategic Recommendations**: Data-driven business advice
- **Market Intelligence Reports**: Comprehensive market analysis
- **ROI Assessments**: Financial impact calculations
- **Competitive Analysis**: Market positioning insights

### Success Metrics
- **Actionable Insights**: Every analysis provides clear recommendations
- **Strategic Value**: Measurable business impact from recommendations
- **Market Leadership**: Maintain #1 position in Israeli meat price intelligence

---

## 🔧 System-Optimizer Agent

### Core Capabilities
- **Build Optimization**: Fast, reliable build processes
- **TypeScript Management**: Error-free type system maintenance
- **Technical Debt Resolution**: Code quality and maintainability
- **Infrastructure Optimization**: System architecture improvements
- **Dependency Management**: Security and performance updates

### Usage Scenarios

#### 🔴 **CRITICAL - MUST USE**
```bash
# Build failures
I need you to act as the system-optimizer specialist. Resolve build failure:
[Error description/logs]

# TypeScript errors
I need you to act as the system-optimizer specialist. Fix TypeScript issues:
[Error details]

# Critical technical issues
I need you to act as the system-optimizer specialist. Resolve critical issue:
[Issue description]
```

#### 🟡 **RECOMMENDED - SHOULD USE**
```bash
# Weekly technical maintenance
I need you to act as the system-optimizer specialist. Perform weekly maintenance.

# Technical debt review
I need you to act as the system-optimizer specialist. Review and address technical debt.

# Performance optimization
I need you to act as the system-optimizer specialist. Optimize system performance.
```

#### 🟢 **AUTO-TRIGGERED**
- On build failures
- On TypeScript compilation errors
- On dependency security alerts
- Weekly technical maintenance cycles

### Expected Outputs
- **Technical Solutions**: Resolved build and compilation issues
- **Optimization Recommendations**: Performance and maintainability improvements
- **Technical Health Report**: System technical status assessment
- **Maintenance Schedule**: Proactive maintenance planning

### Success Metrics
- **Zero Build Failures**: Reliable build and deployment processes
- **TypeScript Compliance**: Error-free type system
- **Technical Excellence**: High code quality and maintainability

---

## 🚀 Team Coordination Workflows

### Complete Vendor Integration Workflow
```bash
# Step 1: Vendor Integration
I need you to act as the vendor-integrator specialist. Integrate new vendor: [vendor details]

# Auto-triggered: Quality Validation
# Auto-triggered: Performance Check  
# Auto-triggered: Documentation Update
# Auto-triggered: Strategic Analysis
# Auto-triggered: Technical Optimization
```

### Quality Audit Workflow
```bash
# Step 1: Quality Audit
I need you to act as the meat-validator specialist. Perform comprehensive quality audit.

# Step 2: Performance Impact Check
I need you to act as the performance-monitor specialist. Check audit performance impact.

# Step 3: Strategic Analysis
I need you to act as the strategic-analyst specialist. Analyze quality trends and business impact.

# Auto-triggered: Documentation Update
```

### Emergency Response Workflow
```bash
# System Crisis Response
1. system-optimizer: Immediate technical issue resolution
2. performance-monitor: Performance impact assessment  
3. docs-maintainer: Incident documentation
4. strategic-analyst: Business impact analysis
5. All agents: Coordinated recovery effort
```

## 📊 Success Monitoring

### Team Performance Dashboard
```javascript
{
  "agent_response_time": "<30s average",
  "task_completion_rate": "99%+",
  "quality_maintenance": "100% meat purity",
  "documentation_accuracy": "100% current",
  "system_performance": "<50ms API maintained",
  "strategic_value": "Measurable business impact"
}
```

### Business Impact Metrics
```javascript
{
  "operational_efficiency": "10x improvement",
  "vendor_integration_time": "3 hours → 30 minutes", 
  "quality_assurance": "Manual → Automatic",
  "documentation_maintenance": "Manual → Automatic",
  "strategic_planning": "Days → Hours",
  "technical_maintenance": "Reactive → Proactive"
}
```

---

## 🎯 Best Practices

### Agent Selection Guidelines
1. **Single Task Focus**: Use one primary agent per task
2. **Coordination Awareness**: Understand auto-trigger relationships
3. **Context Clarity**: Provide clear, specific task context
4. **Success Metrics**: Define expected outcomes
5. **Escalation Paths**: Know when to engage multiple agents

### Quality Assurance
- Always use meat-validator for new products
- Performance-monitor after significant changes
- Docs-maintainer for all system modifications
- Strategic-analyst for business decisions

### Operational Excellence
- Follow critical/recommended/auto-trigger guidelines
- Monitor agent performance metrics
- Maintain team coordination workflows
- Document all major agent interactions

---

*This guide represents the complete operational manual for Basarometer's AI agent team. Each agent is designed for autonomous operation with enterprise-grade quality and performance standards.*