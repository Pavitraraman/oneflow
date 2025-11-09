from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict
from app.database import get_db
from app.models import FinancialEntry, FinancialDocument, Project, User, FinancialEntryType, DocumentType
from app.schemas import FinancialEntryCreate, FinancialEntryResponse
from app.auth import get_current_user
from datetime import date

router = APIRouter()

@router.post("/link_entry", response_model=FinancialEntryResponse, status_code=status.HTTP_201_CREATED)
def link_entry(
    entry: FinancialEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Link a financial entry (revenue or cost) to a project.
    Automatically updates the project's financial fields.
    """
    # Verify project exists
    project = db.query(Project).filter(Project.id == entry.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Validate amount
    if entry.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0"
        )
    
    # Create financial entry
    new_entry = FinancialEntry(
        entry_type=entry.entry_type,
        amount=entry.amount,
        description=entry.description,
        project_id=entry.project_id,
        entry_date=entry.entry_date if entry.entry_date else date.today()
    )
    
    db.add(new_entry)
    
    # Update project financial fields based on entry_type
    if entry.entry_type == FinancialEntryType.REVENUE:
        project.actual_revenue += entry.amount
    elif entry.entry_type == FinancialEntryType.COST:
        project.actual_cost += entry.amount
    
    # Auto-calculate profit
    project.profit = project.actual_revenue - project.actual_cost
    
    db.commit()
    db.refresh(new_entry)
    
    return new_entry

@router.get("/analytics")
def get_finance_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get financial analytics data aggregated by DocumentType.
    Returns revenue and cost breakdowns for charts.
    """
    # Query all financial documents grouped by document type
    docs_by_type = db.query(
        FinancialDocument.doc_type,
        func.sum(FinancialDocument.amount).label('total_amount')
    ).group_by(FinancialDocument.doc_type).all()
    
    # Initialize revenue and cost dictionaries
    revenue_by_type: Dict[str, float] = {}
    cost_by_type: Dict[str, float] = {}
    
    # REVENUE document types: SALES_ORDER, CUSTOMER_INVOICE
    revenue_types = [DocumentType.SALES_ORDER, DocumentType.CUSTOMER_INVOICE]
    
    # COST document types: PURCHASE_ORDER, VENDOR_BILL, EXPENSE
    cost_types = [DocumentType.PURCHASE_ORDER, DocumentType.VENDOR_BILL, DocumentType.EXPENSE]
    
    # Aggregate amounts by type
    for doc_type, total_amount in docs_by_type:
        if doc_type in revenue_types:
            revenue_by_type[doc_type.value] = float(total_amount) if total_amount else 0.0
        elif doc_type in cost_types:
            cost_by_type[doc_type.value] = float(total_amount) if total_amount else 0.0
    
    # Calculate totals
    total_actual_revenue = sum(revenue_by_type.values())
    total_actual_cost = sum(cost_by_type.values())
    
    return {
        "revenue_by_type": revenue_by_type,
        "cost_by_type": cost_by_type,
        "total_actual_revenue": total_actual_revenue,
        "total_actual_cost": total_actual_cost,
    }

