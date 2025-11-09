from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app.models import FinancialDocument, Project, User, DocumentType
from app.schemas import FinancialDocumentCreate, FinancialDocumentResponse
from app.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=FinancialDocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(
    document: FinancialDocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new financial document.
    Requires authentication.
    """
    # Verify project exists if project_id is provided
    if document.project_id:
        project = db.query(Project).filter(Project.id == document.project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
    
    # Validate amount
    if document.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0"
        )
    
    # Create financial document
    new_document = FinancialDocument(
        doc_type=document.doc_type,
        partner_name=document.partner_name,
        document_number=document.document_number,
        amount=document.amount,
        state=document.state,
        project_id=document.project_id,
        created_by_id=current_user.id
    )
    
    db.add(new_document)
    db.commit()
    db.refresh(new_document)
    
    # Reload with relationships
    new_document = db.query(FinancialDocument).options(
        joinedload(FinancialDocument.project),
        joinedload(FinancialDocument.created_by)
    ).filter(FinancialDocument.id == new_document.id).first()
    
    return new_document

@router.get("/", response_model=List[FinancialDocumentResponse])
def get_documents(
    doc_type: Optional[DocumentType] = Query(None, alias="doc_type", description="Filter by document type"),
    project_id: Optional[int] = Query(None, alias="project_id", description="Filter by project ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all financial documents globally.
    Filterable by doc_type and project_id.
    """
    query = db.query(FinancialDocument).options(
        joinedload(FinancialDocument.project),
        joinedload(FinancialDocument.created_by)
    )
    
    if doc_type:
        query = query.filter(FinancialDocument.doc_type == doc_type)
    
    if project_id:
        query = query.filter(FinancialDocument.project_id == project_id)
    
    documents = query.order_by(FinancialDocument.created_at.desc()).all()
    return documents

